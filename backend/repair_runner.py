import httpx
from sqlalchemy.orm import Session

import models
from fault_injection import inject_fault


API_GATEWAY_URL = "http://api-gateway:8080/api/v1/orders"


async def _run_test_workload(num_requests: int = 5) -> dict:
    """
    Runs a simulated workload against the API gateway.

    Measures:
    - success rate
    - average latency
    - error rate
    """

    success_count = 0
    total_time = 0.0
    completed_requests = 0

    async with httpx.AsyncClient() as client:
        for _ in range(num_requests):
            try:
                response = await client.post(
                    API_GATEWAY_URL,
                    json={
                        "item": "aegis-validation",
                        "qty": 1
                    },
                    timeout=5.0
                )

                elapsed_seconds = response.elapsed.total_seconds()

                total_time += elapsed_seconds
                completed_requests += 1

                if response.status_code == 200:
                    success_count += 1

            except Exception as exc:
                print(
                    f"[AEGIS] Validation workload request failed: {exc}"
                )

    if completed_requests == 0:
        return {
            "success_rate": 0.0,
            "error_rate": 1.0,
            "avg_latency_ms": 0.0,
            "sample_count": 0
        }

    success_rate = (
        success_count / completed_requests
    ) * 100

    error_rate = (
        1.0 - (success_count / completed_requests)
    )

    avg_latency_ms = (
        total_time / completed_requests
    ) * 1000

    return {
        "success_rate": success_rate,
        "error_rate": error_rate,
        "avg_latency_ms": avg_latency_ms,
        "sample_count": completed_requests
    }


async def run_repair_validation(
    db: Session,
    proposal_id: int
):
    """
    Runs repair validation for a repair proposal.

    Lifecycle:

        PROPOSED
            ↓
        VALIDATING
            ↓
        baseline measurement
            ↓
        apply repair
            ↓
        post-fix measurement
            ↓
        PASS / FAIL
            ↓
        AWAITING_APPROVAL / FAILED
    """

    # ---------------------------------------------------------
    # 1. Load proposal
    # ---------------------------------------------------------

    proposal = (
        db.query(models.RepairProposal)
        .filter(
            models.RepairProposal.id == proposal_id
        )
        .first()
    )

    if not proposal:
        raise ValueError(
            f"Repair proposal {proposal_id} not found."
        )

    # ---------------------------------------------------------
    # 2. Load incident
    # ---------------------------------------------------------

    incident = (
        db.query(models.Incident)
        .filter(
            models.Incident.id == proposal.incident_id
        )
        .first()
    )

    if not incident:
        raise ValueError(
            f"Incident {proposal.incident_id} not found."
        )

    # ---------------------------------------------------------
    # 3. Mark proposal as validating
    # ---------------------------------------------------------

    proposal.status = "VALIDATING"
    db.commit()

    print(
        f"[AEGIS] Starting repair validation "
        f"for proposal {proposal_id}"
    )

    try:

        # -----------------------------------------------------
        # 4. Measure broken baseline
        # -----------------------------------------------------

        baseline_metrics = await _run_test_workload(5)

        print(
            f"[AEGIS] Baseline metrics: "
            f"{baseline_metrics}"
        )

        # -----------------------------------------------------
        # 5. Apply proposed repair
        #
        # Prototype repair action:
        # remove injected simulator faults.
        # -----------------------------------------------------

        await inject_fault("clear")

        print(
            "[AEGIS] Proposed repair applied: "
            "faults cleared."
        )

        # -----------------------------------------------------
        # 6. Measure post-fix behaviour
        # -----------------------------------------------------

        post_fix_metrics = await _run_test_workload(5)

        print(
            f"[AEGIS] Post-fix metrics: "
            f"{post_fix_metrics}"
        )

        # -----------------------------------------------------
        # 7. Evaluate recovery
        # -----------------------------------------------------

        is_successful = (
            post_fix_metrics["success_rate"] == 100.0
            and post_fix_metrics["avg_latency_ms"] < 500
            and post_fix_metrics["error_rate"] == 0.0
        )

        validation_status = (
            "PASSED"
            if is_successful
            else "FAILED"
        )

        # -----------------------------------------------------
        # 8. Store validation evidence
        # -----------------------------------------------------

        test_run = models.TestRun(
            repair_proposal_id=proposal_id,
            baseline_metrics=baseline_metrics,
            post_fix_metrics=post_fix_metrics,
            status=validation_status
        )

        db.add(test_run)

        if is_successful:
            proposal.status = "AWAITING_APPROVAL"

            print(
                f"[AEGIS] Repair validation PASSED "
                f"for proposal {proposal_id}"
            )

        else:
            proposal.status = "FAILED"

            print(
                f"[AEGIS] Repair validation FAILED "
                f"for proposal {proposal_id}"
            )

        db.commit()
        db.refresh(test_run)

        return test_run

    except Exception as exc:

        db.rollback()

        proposal = (
            db.query(models.RepairProposal)
            .filter(
                models.RepairProposal.id == proposal_id
            )
            .first()
        )

        if proposal:
            proposal.status = "FAILED"
            db.commit()

        print(
            f"[AEGIS] Repair validation error "
            f"for proposal {proposal_id}: {exc}"
        )

        raise