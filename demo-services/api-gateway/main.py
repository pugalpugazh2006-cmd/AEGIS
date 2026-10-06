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
resource = Resource.create({"service.name": "api-gateway"})
trace.set_tracer_provider(TracerProvider(resource=resource))
otlp_exporter = OTLPSpanExporter(endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"))
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

app = FastAPI(title="API Gateway")
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8081")

@app.post("/api/v1/orders")
async def create_order(order: dict):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{ORDER_SERVICE_URL}/orders", json=order, timeout=5.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Error from downstream service")

@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}
