import os
import httpx
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# Telemetry setup
resource = Resource.create({"service.name": "order-service"})
trace.set_tracer_provider(TracerProvider(resource=resource))
otlp_exporter = OTLPSpanExporter(endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"))
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

app = FastAPI(title="Order Service")
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

DB_SIMULATOR_URL = os.getenv("DB_SIMULATOR_URL", "http://db-simulator:8082")

@app.post("/orders")
async def process_order(order: dict):
    # Simulate processing and interacting with the database
    async with httpx.AsyncClient() as client:
        try:
            # Query db-simulator to simulate saving the order
            response = await client.post(f"{DB_SIMULATOR_URL}/query", json={"action": "insert", "table": "orders", "data": order}, timeout=5.0)
            response.raise_for_status()
            db_res = response.json()
            return {"status": "success", "order_id": db_res.get("id", 123), "db_status": db_res}
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"DB Simulator unavailable: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=500, detail="Database operation failed")

@app.get("/health")
def health():
    return {"status": "ok", "service": "order-service"}
