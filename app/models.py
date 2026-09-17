from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=60)
    price: float = Field(..., gt=0, le=1_000_000)
    stock: int = Field(..., ge=0, le=1_000_000)
    min_stock: int = Field(default=5, ge=0, le=1_000_000)

    @field_validator("name", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede estar vacío")
        return value

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    category: Optional[str] = Field(default=None, min_length=2, max_length=60)
    price: Optional[float] = Field(default=None, gt=0, le=1_000_000)
    stock: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    min_stock: Optional[int] = Field(default=None, ge=0, le=1_000_000)

    @field_validator("name", "category")
    @classmethod
    def strip_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede estar vacío")
        return value

class ProductResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    category: str
    price: float
    stock: int
    min_stock: int
    created_at: datetime
    updated_at: datetime
