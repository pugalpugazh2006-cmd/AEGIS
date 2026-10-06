from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
import fault_injection
import repair_runner


router = APIRouter(prefix="/api")


# =============================================================
# HEALTH
# =============================================================

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "aegis-backend"
    }


# =============================================================
# PROJECTS
# =============================================================

@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db)
):
    projects = db.query(models.Project).all()

    if not projects:
        demo_proj = models.Project(
            name="Demo Environment"
        )

        db.add(demo_proj)
        db.commit()
        db.refresh(demo_proj)

        projects = [demo_proj]

    return projects


# =============================================================
# SERVICES
# =============================================================

@router.get("/services")
def list_services(
    db: Session = Depends(get_db)
):
    services = db.query(models.Service).all()

    if not services:
        for service_name in [
            "api-gateway",
            "order-service",
            "db-simulator"
        ]:
            db.add(
                models.Service(
                    name=service_name,
                    description=(
                        f"{service_name.replace('-', ' ').title()} "
                        "demo component"
                    ),
                    is_healthy=1
                )
            )

        db.commit()

        services = db.query(models.Service).all()

    return services


# =============================================================
# TOPOLOGY
# =============================================================

@router.get("/topology")
def get_topology():
    return {
        "nodes": [
            {
                "data": {
                    "id": "api-gateway",
                    "label": "API Gateway"
                }
            },
            {
                "data": {
                    "id": "order-service",
                    "label": "Order Service"
                }
            },
            {
                "data": {
                    "id": "db-simulator",
                    "label": "DB Simulator"
                }
            }
        ],
        "edges": [
            {
                "data": {
                    "source": "api-gateway",
                    "target": "order-service"
                }
            },
            {
                "data": {
                    "source": "order-service",
                    "target": "db-simulator"
                }
            }
        ]
    }


# =============================================================
# INCIDENTS
# =============================================================

@router.get("/incidents")
def list_incidents(
    db: Session = Depends(get_db)
):
    return (
        db.query(models.Incident)
        .order_by(models.Incident.id.desc())
        .all()
    )


@router.get("/incidents/{incident_id}")
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.id == incident_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    root_causes = (
        db.query(models.RootCauseCandidate)
        .filter(
            models.RootCauseCandidate.incident_id
            == incident_id
        )
        .order_by(
            models.RootCauseCandidate.rank.asc()
        )
        .all()
    )

    repairs = (
        db.query(models.RepairProposal)
        .filter(
            models.RepairProposal.incident_id
            == incident_id
        )
        .order_by(
            models.RepairProposal.id.desc()
        )
        .all()
    )

    return {
        "incident": incident,
        "root_causes": root_causes,
        "repairs": repairs
    }


# =============================================================
# ROOT CAUSE CANDIDATES
# =============================================================

@router.get("/incidents/{incident_id}/root-causes")
def get_root_causes(
    incident_id: int,
    db: Session = Depends(get_db)
):
    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.id == incident_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return (
        db.query(models.RootCauseCandidate)
        .filter(
            models.RootCauseCandidate.incident_id
            == incident_id
        )
        .order_by(
            models.RootCauseCandidate.rank.asc()
        )
        .all()
    )


# =============================================================
# EXPERIMENTS
# =============================================================

class ExperimentCreate(BaseModel):
    scenario_type: str
    target_service_id: int


@router.post("/experiments")
async def create_experiment(
    exp: ExperimentCreate,
    db: Session = Depends(get_db)
):
    record = (
        await fault_injection.create_and_start_experiment(
            db,
            exp.scenario_type,
            exp.target_service_id
        )
    )

    return record


# =============================================================
# REPAIR PROPOSALS
# =============================================================

class RepairCreate(BaseModel):
    incident_id: int
    action_type: str


@router.post("/repairs")
def create_repair(
    repair: RepairCreate,
    db: Session = Depends(get_db)
):
    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.id == repair.incident_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    if incident.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Repair can only be proposed for an active incident"
        )

    proposal = models.RepairProposal(
        incident_id=repair.incident_id,
        action_type=repair.action_type,
        status="PROPOSED"
    )

    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    print(
        f"[AEGIS] Repair proposal created: "
        f"{proposal.id} for incident "
        f"{repair.incident_id}"
    )

    return proposal


# =============================================================
# REPAIR VALIDATION
# =============================================================

@router.post("/repairs/{repair_id}/validate")
async def validate_repair(
    repair_id: int,
    db: Session = Depends(get_db)
):
    proposal = (
        db.query(models.RepairProposal)
        .filter(
            models.RepairProposal.id == repair_id
        )
        .first()
    )

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Repair proposal not found"
        )

    if proposal.status not in [
        "PROPOSED",
        "FAILED"
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Repair proposal is in "
                f"'{proposal.status}' state"
            )
        )

    test_run = await repair_runner.run_repair_validation(
        db,
        repair_id
    )

    return test_run


# =============================================================
# TEST RUN / VALIDATION EVIDENCE
# =============================================================

@router.get("/repairs/{repair_id}/test-runs")
def get_test_runs(
    repair_id: int,
    db: Session = Depends(get_db)
):
    proposal = (
        db.query(models.RepairProposal)
        .filter(
            models.RepairProposal.id == repair_id
        )
        .first()
    )

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Repair proposal not found"
        )

    return (
        db.query(models.TestRun)
        .filter(
            models.TestRun.repair_proposal_id
            == repair_id
        )
        .order_by(
            models.TestRun.id.desc()
        )
        .all()
    )


# =============================================================
# REPAIR APPROVAL
# =============================================================

@router.post("/repairs/{repair_id}/approve")
def approve_repair(
    repair_id: int,
    db: Session = Depends(get_db)
):
    proposal = (
        db.query(models.RepairProposal)
        .filter(
            models.RepairProposal.id == repair_id
        )
        .first()
    )

    if not proposal:
        raise HTTPException(
            status_code=404,
            detail="Repair proposal not found"
        )

    if proposal.status != "AWAITING_APPROVAL":
        raise HTTPException(
            status_code=400,
            detail=(
                "Repair must successfully pass validation "
                "before approval."
            )
        )

    # ---------------------------------------------------------
    # Approve proposal
    # ---------------------------------------------------------

    proposal.status = "APPROVED"

    # ---------------------------------------------------------
    # Resolve incident
    # ---------------------------------------------------------

    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.id == proposal.incident_id
        )
        .first()
    )

    if incident:
        incident.status = "RESOLVED"
        incident.resolved_time = datetime.utcnow()

    # ---------------------------------------------------------
    # Restore root-cause service health
    #
    # Rank #1 RCA candidate is used as the affected service.
    # ---------------------------------------------------------

    if incident:

        root_cause = (
            db.query(models.RootCauseCandidate)
            .filter(
                models.RootCauseCandidate.incident_id
                == incident.id
            )
            .order_by(
                models.RootCauseCandidate.rank.asc()
            )
            .first()
        )

        if root_cause:

            service = (
                db.query(models.Service)
                .filter(
                    models.Service.name
                    == root_cause.service_name
                )
                .first()
            )

            if service:
                service.is_healthy = 1

                print(
                    f"[AEGIS] Service "
                    f"'{service.name}' restored to HEALTHY."
                )

    db.commit()

    print(
        f"[AEGIS] Repair {repair_id} approved. "
        f"Incident {proposal.incident_id} resolved."
    )

    return {
        "status": "approved",
        "proposal_id": repair_id,
        "incident_id": proposal.incident_id,
        "incident_status": (
            incident.status
            if incident
            else "UNKNOWN"
        ),
        "resolved_at": (
            incident.resolved_time
            if incident
            else None
        )
    }