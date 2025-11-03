from pydantic import BaseModel, Field, constr
from typing import Optional

class Product(BaseModel):
    pro_id: Optional[constr(strip_whitespace=True, min_length=2, max_length=50)] = Field(
        None,
        example="PROD001",
        description="Unique product ID (auto-generated if not provided)"
    )
    cat_id: constr(strip_whitespace=True, min_length=2, max_length=50) = Field(
        ...,
        example="CAT001",
        description="Category ID linked to this product"
    )
    product_name: constr(strip_whitespace=True, min_length=2, max_length=100) = Field(
        ...,
        example="Smartphone X",
        description="Product name (2–100 characters)"
    )
    product_description: constr(strip_whitespace=True, min_length=10, max_length=500) = Field(
        ...,
        example="High-end smartphone with 128GB storage and 8GB RAM",
        description="Detailed product description (10–500 characters)"
    )
    price: constr(strip_whitespace=True, pattern=r"^\d+(\.\d{1,2})?$") = Field(
        ...,
        example="499.99",
        description="Product price (numeric, up to 2 decimal places)"
    )

    class Config:
        orm_mode = True
        json_schema_extra = {
            "example": {
                "pro_id":"example",
                "cat_id": "CAT001",
                "price": "499.99",
                "product_description": "High-end smartphone with 128GB storage",
                "product_name": "Smartphone X",

            }
        }
