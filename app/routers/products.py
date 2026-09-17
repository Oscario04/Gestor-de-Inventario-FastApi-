from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import PyMongoError

from app.database import get_database
from app.models import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()

def serialize_product(document: dict) -> dict:
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "category": document["category"],
        "price": float(document["price"]),
        "stock": int(document["stock"]),
        "min_stock": int(document["min_stock"]),
        "created_at": document["created_at"],
        "updated_at": document["updated_at"],
    }

def parse_object_id(product_id: str) -> ObjectId:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID proporcionado no es válido.",
        )
    return ObjectId(product_id)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db=Depends(get_database)):
    now = datetime.now(timezone.utc)
    document = payload.model_dump()
    document.update({"created_at": now, "updated_at": now})

    try:
        result = await db.products.insert_one(document)
        created = await db.products.find_one({"_id": result.inserted_id})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No fue posible guardar el producto.",
        )

    return serialize_product(created)

@router.get("", response_model=list[ProductResponse])
async def list_products(db=Depends(get_database)):
    cursor = db.products.find().sort("created_at", -1)
    documents = await cursor.to_list(length=500)
    return [serialize_product(document) for document in documents]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db=Depends(get_database)):
    object_id = parse_object_id(product_id)
    document = await db.products.find_one({"_id": object_id})

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    return serialize_product(document)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    db=Depends(get_database),
):
    object_id = parse_object_id(product_id)
    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos un campo para actualizar.",
        )

    changes["updated_at"] = datetime.now(timezone.utc)

    result = await db.products.update_one(
        {"_id": object_id},
        {"$set": changes},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    document = await db.products.find_one({"_id": object_id})
    return serialize_product(document)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: str, db=Depends(get_database)):
    object_id = parse_object_id(product_id)
    result = await db.products.delete_one({"_id": object_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

    return None
