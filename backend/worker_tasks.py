import asyncio
import os
import time
from datetime import datetime

import httpx
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

import models
from database import SessionLocal
from intelligence.detectors import IsolationForestDetector
from intelligence.rca_engine import RCAEngine


API_GATEWAY_URL = os.getenv(
    "API_GATEWAY_URL",
    "http://api-gateway:8080/api/v1/orders"
)


async def measure_live_workload(num_requests: int = 5) -> dict:
    """
    Sends real requests through the demo application and measures
    current latency and error rate.
    """

    latencies = []
    success_count = 0

    async with httpx.AsyncClient() as client:
        for _ in range(num_requests):
            start = asyncio.get_running_loop().time()

            try:
                response = await client.post(
                    API_GATEWAY_URL,
                    json={
                        "item": "aegis-test",
                        "qty": 1
                    },
                    timeout=5.0
                )

                elapsed_ms = (
                    asyncio.get_running_loop().time() - start
                ) * 1000

                latencies.append(elapsed_ms)

                if response.status_code == 200:
                    success_count += 1

            except Exception as exc:
                elapsed_ms = (
                    asyncio.get_running_loop().time() - start
                ) * 1000

                latencies.append(elapsed_ms)

                print(
                    f"[AEGIS] Workload request failed: {exc}"
                )

    total = len(latencies)

    avg_latency_ms = (
        sum(latencies) / total
        if total > 0
        else 0.0
    )

    success_rate = (
        success_count / total
        if total > 0
        else 0.0
    )

    error_rate = 1.0 - success_rate

    return {
        "avg_latency_ms": avg_latency_ms,
        "error_rate": error_rate,
        "success_rate": success_rate,
        "sample_count": total
    }


def detect_anomaly(metrics: dict) -> bool:
    """
    Hybrid anomaly detection.

    AEGIS combines:
    1. Isolation Forest machine-learning detection
    2. Operational SLO safety guards

    The safety guards ensure severe production degradation
    is not missed by the ML model.
    """

    baseline = pd.DataFrame({
        "latency": [
            18, 21, 20, 24, 19,
            22, 20, 23, 21, 19,
            22, 20, 24, 18, 21,
            20, 22, 19, 23, 21
        ],
        "error_rate": np.zeros(20)
    })

    current = pd.DataFrame({
        "latency": [
            metrics["avg_latency_ms"]
        ],
        "error_rate": [
            metrics["error_rate"]
        ]
    })

    # ---------------------------------------------------------
    # 1. Machine-learning detector
    # ---------------------------------------------------------

    detector = IsolationForestDetector(
        contamination=0.10,
        random_seed=42
    )

    detector.fit(baseline)

    ml_anomaly = bool(
        detector.detect(current).iloc[0]
    )

    # ---------------------------------------------------------
    # 2. Operational SLO safety guards
    # ---------------------------------------------------------

    latency_anomaly = (
        metrics["avg_latency_ms"] >= 500
    )

    error_anomaly = (
        metrics["error_rate"] >= 0.20
    )

    safety_anomaly = (
        latency_anomaly or error_anomaly
    )

    final_anomaly = (
        ml_anomaly or safety_anomaly
    )

    print(
        "[AEGIS] Detection details: "
        f"ML={ml_anomaly}, "
        f"latency_guard={latency_anomaly}, "
        f"error_guard={error_anomaly}, "
        f"final={final_anomaly}"
    )

    return final_anomaly


def build_rca() -> list[dict]:
    """
    Builds the demo application's dependency graph
    and performs explainable root-cause analysis.
    """

    engine = RCAEngine()

    # Dependency graph:
    #
    # api-gateway
    #       ↓
    # order-service
    #       ↓
    # db-simulator

    engine.add_dependency(
        "api-gateway",
        "order-service"
    )

    engine.add_dependency(
        "order-service",
        "db-simulator"
    )

    anomalous_services = [
        "api-gateway",
        "order-service",
        "db-simulator"
    ]

    return engine.rank_root_causes(
        anomalous_services
    )


def process_experiment(experiment_id: int) -> None:
    """
    Main RQ worker task.

    Flow:
        Experiment
            ↓
        Live workload
            ↓
        Anomaly detection
            ↓
        Incident creation
            ↓
        RCA
            ↓
        Root cause candidates
    """

    db: Session = SessionLocal()

    try:

        # -----------------------------------------------------
        # 1. Fetch experiment
        # -----------------------------------------------------

        experiment = (
            db.query(models.Experiment)
            .filter(
                models.Experiment.id == experiment_id
            )
            .first()
        )

        if not experiment:
            print(
                f"[AEGIS] Experiment "
                f"{experiment_id} not found."
            )
            return

        print(
            f"[AEGIS] Processing experiment "
            f"{experiment.id} "
            f"({experiment.scenario_type})"
        )

        # -----------------------------------------------------
        # 2. Wait for fault to take effect
        # -----------------------------------------------------

        time.sleep(2)

        # -----------------------------------------------------
        # 3. Measure real application behaviour
        # -----------------------------------------------------

        metrics = asyncio.run(
            measure_live_workload(5)
        )

        print(
            f"[AEGIS] Live metrics: {metrics}"
        )

        # -----------------------------------------------------
        # 4. Detect anomaly
        # -----------------------------------------------------

        is_anomaly = detect_anomaly(metrics)

        print(
            f"[AEGIS] Anomaly detected: "
            f"{is_anomaly}"
        )

        # -----------------------------------------------------
        # 5. Create incident when anomaly is detected
        # -----------------------------------------------------

        if is_anomaly:

            if (
                metrics["error_rate"] >= 0.50
                or metrics["avg_latency_ms"] >= 1500
            ):
                severity = "CRITICAL"

            elif (
                metrics["error_rate"] >= 0.20
                or metrics["avg_latency_ms"] >= 500
            ):
                severity = "HIGH"

            else:
                severity = "MEDIUM"

            incident = models.Incident(
                title=(
                    f"{experiment.scenario_type} detected "
                    f"in db-simulator"
                ),
                severity=severity,
                status="ACTIVE",
                start_time=datetime.utcnow()
            )

            db.add(incident)
            db.commit()
            db.refresh(incident)

            print(
                f"[AEGIS] Incident created: "
                f"{incident.id} "
                f"severity={severity}"
            )

            # -------------------------------------------------
            # 6. Mark affected service unhealthy
            # -------------------------------------------------

            target_service = (
                db.query(models.Service)
                .filter(
                    models.Service.id
                    == experiment.target_service_id
                )
                .first()
            )

            if target_service:
                target_service.is_healthy = 0

            # -------------------------------------------------
            # 7. Root Cause Analysis
            # -------------------------------------------------

            candidates = build_rca()

            print(
                f"[AEGIS] RCA candidates: "
                f"{candidates}"
            )

            # -------------------------------------------------
            # 8. Save root cause candidates
            # -------------------------------------------------

            for candidate in candidates:

                root_cause = (
                    models.RootCauseCandidate(
                        incident_id=incident.id,
                        service_name=candidate["service"],
                        rank=candidate["rank"],
                        score=candidate["score"],
                        evidence_json={
                            "evidence": candidate["evidence"],
                            "observed_metrics": metrics,
                            "experiment_id": experiment.id
                        }
                    )
                )

                db.add(root_cause)

            # -------------------------------------------------
            # 9. Complete experiment
            # -------------------------------------------------

            experiment.status = "COMPLETED"
            experiment.end_time = datetime.utcnow()

            db.commit()

            print(
                f"[AEGIS] RCA completed "
                f"for incident {incident.id}"
            )

        else:

            # No anomaly
            experiment.status = "COMPLETED"
            experiment.end_time = datetime.utcnow()

            db.commit()

            print(
                f"[AEGIS] Experiment "
                f"{experiment.id} completed "
                f"without anomaly."
            )

    except Exception as exc:

        db.rollback()

        experiment = (
            db.query(models.Experiment)
            .filter(
                models.Experiment.id == experiment_id
            )
            .first()
        )

        if experiment:
            experiment.status = "FAILED"
            experiment.end_time = datetime.utcnow()
            db.commit()

        print(
            f"[AEGIS] Worker failed for "
            f"experiment {experiment_id}: {exc}"
        )

        raise

    finally:
        db.close()