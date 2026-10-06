import os
import asyncio
import random
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Telemetry setup
resource = Resource.create({"service.name": "db-simulator"})
trace.set_tracer_provider(TracerProvider(resource=resource))
otlp_exporter = OTLPSpanExporter(endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"))
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

app = FastAPI(title="DB Simulator")
FastAPIInstrumentor.instrument_app(app)

# Global fault configuration for the demo
# These can be modified by the backend during an experiment to inject faults
fault_config = {
    "latency_ms": 0,
    "error_rate": 0.0
}

@app.post("/query")
async def execute_query(query: dict):
    # Inject configurable latency
    if fault_config["latency_ms"] > 0:
        await asyncio.sleep(fault_config["latency_ms"] / 1000.0)
    else:
        # Normal baseline latency (e.g. 10-50ms)
        await asyncio.sleep(random.uniform(0.01, 0.05))
        
    # Inject configurable error rate
    if fault_config["error_rate"] > 0 and random.random() < fault_config["error_rate"]:
        raise HTTPException(status_code=500, detail="Database internal error (Simulated Fault)")
        
    return {"status": "success", "id": random.randint(1000, 9999), "query": query}

@app.post("/admin/faults")
def set_faults(config: dict):
    """
    Admin endpoint to inject faults during an experiment.
    Expects: {"latency_ms": 1000, "error_rate": 0.5}
    """
    global fault_config
    if "latency_ms" in config:
        fault_config["latency_ms"] = config["latency_ms"]
    if "error_rate" in config:
        fault_config["error_rate"] = config["error_rate"]
    return {"status": "faults_updated", "current_config": fault_config}

@app.get("/health")
def health():
    return {"status": "ok", "service": "db-simulator"}
