from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    JSON
)

import datetime

from database import Base


# =============================================================
# PROJECT
# =============================================================

class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        unique=True,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )


# =============================================================
# SERVICE
# =============================================================

class Service(Base):
    __tablename__ = "services"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )

    name = Column(
        String,
        index=True
    )

    description = Column(
        String
    )

    # 1 = HEALTHY
    # 0 = ANOMALOUS
    is_healthy = Column(
        Integer,
        default=1
    )


# =============================================================
# EXPERIMENT
# =============================================================

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    scenario_type = Column(
        String
    )

    target_service_id = Column(
        Integer,
        ForeignKey("services.id")
    )

    start_time = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    end_time = Column(
        DateTime,
        nullable=True
    )

    # RUNNING / COMPLETED / FAILED
    status = Column(
        String
    )

    ground_truth = Column(
        String
    )


# =============================================================
# INCIDENT
# =============================================================

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String
    )

    # MEDIUM / HIGH / CRITICAL
    severity = Column(
        String
    )

    # ACTIVE / RESOLVED
    status = Column(
        String
    )

    start_time = Column(
        DateTime,
        default=datetime.datetime.utcnow
    )

    resolved_time = Column(
        DateTime,
        nullable=True
    )


# =============================================================
# ROOT CAUSE CANDIDATE
# =============================================================

class RootCauseCandidate(Base):
    __tablename__ = "root_cause_candidates"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    incident_id = Column(
        Integer,
        ForeignKey("incidents.id")
    )

    service_name = Column(
        String
    )

    rank = Column(
        Integer
    )

    score = Column(
        Float
    )

    # Stores explainable RCA evidence and observed metrics
    evidence_json = Column(
        JSON
    )


# =============================================================
# REPAIR PROPOSAL
# =============================================================

class RepairProposal(Base):
    __tablename__ = "repair_proposals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    incident_id = Column(
        Integer,
        ForeignKey("incidents.id")
    )

    # Example:
    # clear_fault
    # restart_service
    # rollback
    # scale_service
    action_type = Column(
        String
    )

    # PROPOSED
    # VALIDATING
    # AWAITING_APPROVAL
    # APPROVED
    # FAILED
    status = Column(
        String
    )


# =============================================================
# TEST RUN / VALIDATION EVIDENCE
# =============================================================

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    repair_proposal_id = Column(
        Integer,
        ForeignKey("repair_proposals.id")
    )

    # Metrics before repair
    baseline_metrics = Column(
        JSON
    )

    # Metrics after repair
    post_fix_metrics = Column(
        JSON
    )

    # PASSED / FAILED
    status = Column(
        String
    )