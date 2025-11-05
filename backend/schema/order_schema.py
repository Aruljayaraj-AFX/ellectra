from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime

# Schema for each item in an order
class OrderItemCreate(BaseModel):
    pro_id: str
    quantity: int = Field(gt=0, description="Quantity must be greater than 0")

class OrderItemResponse(BaseModel):
    pro_id: str
    product_name: str
    product_img: Optional[str]
    quantity: int
    price_per_item: float
    item_total: float

# Schema for creating a new order with multiple items
class PastOrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_items=1, description="At least one item required")
    delivery_address: str
    city: str
    pincode: str
    landmark: Optional[str] = None
    delivery_type: Optional[str] = "Home Delivery"
    payment_status: Optional[str] = "Pending"

    class Config:
        from_attributes = True

# Schema for updating order delivery details
class PastOrderUpdate(BaseModel):
    delivery_address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    delivery_type: Optional[str] = None

    class Config:
        from_attributes = True

# Schema for complete order response
class PastOrderResponse(BaseModel):
    order_id: str
    user_id: str
    user_name: str
    user_email: str
    user_phoneno: str
    items: List[OrderItemResponse]
    total_amount: float
    payment_status: str
    status: str
    delivery_address: str
    city: str
    pincode: str
    landmark: Optional[str]
    delivery_type: str
    order_date: datetime

    class Config:
        from_attributes = True