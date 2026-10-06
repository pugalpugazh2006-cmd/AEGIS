import os
from datetime import datetime

import httpx
import redis
from rq import Queue
from sqlalchemy.orm import Session

import models


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://redis:6379/0"
)

DB_SIMULATOR_ADMIN_URL = os.getenv(
    "DB_SIMULATOR_ADMIN_URL",
    "http://db-simulator:8082/admin/faults"
)


async def inject_fault(scenario_type: str) -> dict:
    """
    Communicates with the db-simulator to inject or clear
    predefined faults.
    """

    config = {}

    if scenario_type == "latency_spike":
        config = {
            "latency_ms": 2000,
            "error_rate": 0.0
        }

    elif scenario_type == "high_error_rate":
        config = {
            "latency_ms": 0,
            "error_rate": 0.75
        }

    elif scenario_type == "clear":
        config = {
            "latency_ms": 0,
            "error_rate": 0.0
        }

    else:
        raise ValueError(
            f"Unknown scenario_type: {scenario_type}"
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            DB_SIMULATOR_ADMIN_URL,
            json=config,
            timeout=5.0
        )

        response.raise_for_status()

        return response.json()


async def create_and_start_experiment(
    db: Session,
    scenario_type: str,
    target_service_id: int
):
    """
    Creates an experiment record, applies the requested fault,
    and queues real fault scenarios for background intelligence
    processing.

    'clear' is treated as a recovery/reset action and is NOT
    queued for anomaly analysis.
    """

    # ---------------------------------------------------------
    # 1. Create experiment record
    # ---------------------------------------------------------

    ground_truth = (
        "Cleared faults and restored db-simulator"
        if scenario_type == "clear"
        else f"Injected {scenario_type} into db-simulator"
    )

    experiment = models.Experiment(
        scenario_type=scenario_type,
        target_service_id=target_service_id,
        status="RUNNING",
        ground_truth=ground_truth
    )

    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    # ---------------------------------------------------------
    # 2. Apply / clear fault
    # ---------------------------------------------------------

    try:
        fault_result = await inject_fault(scenario_type)

        print(
            f"[AEGIS] Fault action successful: "
            f"experiment={experiment.id}, "
            f"scenario={scenario_type}, "
            f"result={fault_result}"
        )

    except Exception as exc:
        experiment.status = "FAILED"
        experiment.end_time = datetime.utcnow()

        db.commit()

        print(
            f"[AEGIS] Fault action failed for "
            f"experiment {experiment.id}: {exc}"
        )

        raise

    # ---------------------------------------------------------
    # 3. CLEAR = recovery/reset action
    # ---------------------------------------------------------

    if scenario_type == "clear":

        target_service = (
            db.query(models.Service)
            .filter(
                models.Service.id == target_service_id
            )
            .first()
        )

        if target_service:
            target_service.is_healthy = 1

            print(
                f"[AEGIS] Service '{target_service.name}' "
                f"marked HEALTHY after clearing faults."
            )
        else:
            print(
                f"[AEGIS] Target service "
                f"{target_service_id} not found."
            )

        experiment.status = "COMPLETED"
        experiment.end_time = datetime.utcnow()

        db.commit()

        print(
            f"[AEGIS] Recovery completed for "
            f"experiment {experiment.id}. "
            f"No anomaly-analysis job queued."
        )

        return experiment

    # ---------------------------------------------------------
    # 4. Queue real fault scenarios for intelligence processing
    # ---------------------------------------------------------

    try:
        # Import here to avoid module-level circular dependency.
        from worker_tasks import process_experiment

        # Connect to Redis
        redis_conn = redis.from_url(
            REDIS_URL,
            decode_responses=False
        )

        # Verify Redis connectivity
        redis_conn.ping()

        # Get AEGIS worker queue
        queue = Queue(
            name="aegis_tasks",
            connection=redis_conn
        )

        # Queue background intelligence task
        job = queue.enqueue(
            process_experiment,
            experiment.id
        )

        print(
            f"[AEGIS] Experiment {experiment.id} queued "
            f"for anomaly analysis. "
            f"Job ID={job.id}"
        )

    except Exception as exc:
        experiment.status = "FAILED"
        experiment.end_time = datetime.utcnow()

        db.commit()

        print(
            f"[AEGIS] Failed to queue experiment "
            f"{experiment.id}: {exc}"
        )

        raise

    return experiment