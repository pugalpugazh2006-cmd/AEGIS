from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import api

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AEGIS API", description="Autonomous Engineering Guard & Intelligent Self-Healing System")

# Allow CORS for local React dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router)

