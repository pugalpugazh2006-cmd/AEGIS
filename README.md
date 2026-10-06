# AEGIS — Autonomous Engineering Guard & Intelligent Self-Healing System

## Project Objective
Create an explainable software reliability platform that monitors a simulated distributed application, detects abnormal behaviour, identifies probable root causes, proposes corrective actions, tests fixes in an isolated environment, and verifies recovery.

## Repository Structure
```
AEGIS/
├── frontend/           # React, TypeScript, Vite, Tailwind, Cytoscape
├── backend/            # FastAPI, SQLAlchemy, Redis/RQ worker, anomaly detection
├── demo-services/      # API Gateway, Order Service, Database Simulator
├── infrastructure/     # Docker Compose, Prometheus, Otel Collector, Postgres, Redis
├── docs/               # Architecture, API contracts, setup guides
├── tests/              # E2E tests and global test configuration
├── docker-compose.yml  # Main local deployment manifest
└── README.md           # Setup and execution guide
```

## Setup and Execution Guide

### Prerequisites
- Docker and Docker Compose installed.

### Running the Environment (Phase 1)
For the current phase, you can build and run the core infrastructure (PostgreSQL, Redis, Prometheus, Otel Collector), the FastAPI backend, and the Vite React frontend.

```bash
cd AEGIS
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090

## Milestone Plan

**Phase 1: Architecture & Setup** (Complete)
- Scaffold repository structure.
- Define DB Models, API contracts, and architecture.
- Setup base FastAPI, SQLAlchemy, and React apps.

**Phase 2: Demo Services & Telemetry** (Complete)
- Implement API Gateway, Order Service, and Database Simulator.
- Instrument with OpenTelemetry.
- Deploy Prometheus and Otel Collector via Docker Compose.

**Phase 3: Anomaly Detection & RCA** (Complete)
- Implement rolling statistical and Isolation Forest detectors.
- Build dependency graph and RCA engine.
- Add unit tests.

**Phase 4: Persistence & Dashboard** (Complete)
- PostgreSQL migrations.
- API endpoints integration.
- React SRE command-center frontend.

**Phase 5: Fault Injection & Repair** (Complete)
- Implement controlled fault injection.
- Repair validation runner.
- Supervised approval workflow.

**Phase 6: Final Integration & Evaluation** (Complete)
- Complete E2E workflow.
- Research evaluation scripts.
- Finalize demo and documentation.
