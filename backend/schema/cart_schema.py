from pydantic import BaseModel
from typing import Optional

class CartCreate(BaseModel):
    pro_id: str
    quantity: int

class CartUpdate(BaseModel):
    quantity: int