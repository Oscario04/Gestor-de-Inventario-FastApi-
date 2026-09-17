import asyncio
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

class ReportRequest(BaseModel):
    iterations: int = Field(default=35_000_000, ge=1_000_000, le=100_000_000)

def cpu_intensive_task(iterations: int) -> dict:
    """
    Trabajo CPU-bound simulado.
    Se ejecuta en un hilo secundario mediante asyncio.to_thread().
    """
    started = time.perf_counter()
    accumulator = 0

    for i in range(iterations):
        accumulator = (accumulator + (i * i) % 97_531) % 1_000_003

    elapsed = time.perf_counter() - started

    return {
        "result": accumulator,
        "iterations": iterations,
        "processing_seconds": round(elapsed, 3),
        "message": "La tarea CPU terminó en un hilo secundario.",
    }

@router.post("/cpu")
async def generate_cpu_report(payload: ReportRequest):
    try:
        result = await asyncio.to_thread(cpu_intensive_task, payload.iterations)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error durante el procesamiento: {exc}",
        )
