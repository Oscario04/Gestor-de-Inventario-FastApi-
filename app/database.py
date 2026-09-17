import os
from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

DATABASE_NAME = os.getenv("DATABASE_NAME", "inventory_db")

async def connect_database(app: FastAPI) -> None:
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("MONGODB_URI no está configurada en el archivo .env")

    client = AsyncIOMotorClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000,
    )
    await client.admin.command("ping")

    app.state.mongo_client = client
    app.state.db = client[DATABASE_NAME]

async def close_database(app: FastAPI) -> None:
    client = getattr(app.state, "mongo_client", None)
    if client:
        client.close()

def get_database(request: Request):
    return request.app.state.db
