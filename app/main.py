from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient

from app.database import close_database, connect_database
from app.routers import products, reports

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_database(app)
    yield
    await close_database(app)

app = FastAPI(
    title="Gestor de Inventario API",
    version="1.0.0",
    description="API REST con FastAPI, Pydantic, MongoDB Atlas y procesamiento concurrente.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
