# AEGIS Architecture & Design

## 1. Component Responsibilities

1. **React Frontend**: Provides the SRE command center, rendering topology graphs, displaying dashboards, experiments, and incident reports. Interacts with the backend via REST.
2. **FastAPI Backend**: The core intelligence hub. Orchestrates API endpoints, queries metrics from Prometheus, writes anomalies/incidents to PostgreSQL, and triggers tests.
3. **PostgreSQL**: Stores relational data: users, projects, services, experiments, incidents, root-cause results, repair proposals, and audit logs.
4. **Redis & RQ**: Handles background processing for anomaly detection and test executions to avoid blocking the API.
5. **Telemetry Layer (Otel Collector + Prometheus)**: Collects metrics and traces from services and provides querying capabilities for the backend.
6. **Demo Services**:
   - `api-gateway`: Routes traffic.
   - `order-service`: Processes orders.
   - `db-simulator`: Simulates database interactions with controllable latency/errors.

## 2. API Contracts

### Endpoints
- `GET /api/health` - System health check.
- `GET /api/projects` - List projects.
- `GET /api/services` - List monitored services and status.
- `GET /api/topology` - Get dependency graph (nodes and edges).
- `POST /api/experiments` - Create a fault injection experiment.
- `GET /api/experiments/{id}` - Experiment details and status.
- `GET /api/incidents` - List active and historical incidents.
- `GET /api/incidents/{id}/diagnosis` - Get root cause candidates and evidence.
- `POST /api/repairs` - Propose a repair for an incident.
- `POST /api/repairs/{id}/validate` - Run sandbox validation.
- `POST /api/repairs/{id}/approve` - Approve or reject repair.

## 3. Database Models (SQLAlchemy)

- **Project**: `id`, `name`, `created_at`
- **Service**: `id`, `project_id`, `name`, `description`, `is_healthy`
- **Dependency**: `id`, `source_service_id`, `target_service_id`
- **Experiment**: `id`, `scenario_type`, `target_service_id`, `start_time`, `end_time`, `status`, `ground_truth`
- **Incident**: `id`, `title`, `severity`, `status`, `start_time`, `resolved_time`
- **Anomaly**: `id`, `incident_id`, `service_id`, `metric_name`, `timestamp`, `score`
- **RootCauseCandidate**: `id`, `incident_id`, `service_id`, `rank`, `score`, `evidence_json`
- **RepairProposal**: `id`, `incident_id`, `action_type`, `status` (PROPOSED, VALIDATING, PASSED, FAILED, AWAITING_APPROVAL, APPROVED, REJECTED)
- **TestRun**: `id`, `repair_proposal_id`, `baseline_metrics`, `post_fix_metrics`, `status`
