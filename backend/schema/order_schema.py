from pydantic import BaseModel
from typing import Optional

class PastOrderCreate(BaseModel):
    pro_id: str
    quantity: int
    total_amount: float
    payment_status: Optional[str] = "Pending"
    delivery_address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    delivery_type: Optional[str] = "Home Delivery"

class PastOrderUpdate(BaseModel):
    payment_status: Optional[str] = None
    delivery_address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    delivery_type: Optional[str] = None
