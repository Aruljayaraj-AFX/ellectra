from pydantic import BaseModel, Field, StringConstraints,constr,conint
from typing import Optional, Annotated

class UserUpdate(BaseModel):
    user_name: Optional[constr(strip_whitespace=True, min_length=2, max_length=50)] = Field(
        None, description="User's full name (2–50 characters)"
    )
    user_number: Optional[conint(ge=1000000000, le=9999999999)] = Field(
        None, description="10-digit Indian phone number"
    )
    user_door_no: Optional[constr(strip_whitespace=True, min_length=1, max_length=20)] = Field(
        None, description="Door or flat number"
    )
    user_address: Optional[constr(strip_whitespace=True, min_length=5, max_length=200)] = Field(
        None, description="Full address line"
    )
    user_city: Optional[constr(strip_whitespace=True, min_length=2, max_length=50)] = Field(
        None, description="City name"
    )
    user_pincode: Optional[constr(pattern=r'^\d{6}$')] = Field(
        None, description="6-digit Indian pincode"
    )
    Landmark: Optional[constr(strip_whitespace=True, min_length=2, max_length=100)] = Field(
        None, description="Landmark near user's address"
    )

    class Config:
        json_schema_extra = {  
            "example": {
                "user_name": "Arul J",
                "user_number": 9876543210,
                "user_door_no": "12A",
                "user_address": "123 Ellectra Street",
                "user_city": "Chennai",
                "user_pincode": "600042",
                "landmark": "Near Bus Stop"
            }
        }