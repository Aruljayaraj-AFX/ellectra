from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.DB import get_DB
from models.order_table import past_order_table
from models.product import product_table
from models.user import user_table
from services.user import user_Authorization
from schema.order_schema import PastOrderCreate, PastOrderUpdate
from models.cart_table import cart_table
from pydantic import BaseModel
from typing import Optional
from enum import Enum
import uuid
from sqlalchemy import func

router_past_order = APIRouter()

# Define allowed values for payment and order status
class PaymentStatus(str, Enum):
    PENDING = "Pending"
    SUCCESSFULLY = "Successfully"

class OrderStatus(str, Enum):
    PENDING = "Pending"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"

# Schema for status update
class OrderStatusUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    status: Optional[OrderStatus] = None
    
    class Config:
        from_attributes = True
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.payment_status is None and self.status is None:
            raise ValueError('At least one status field must be provided')


# 🆔 Generate Unique Order ID
async def generate_order_id(db: Session):
    """Generate a unique order ID like ORD123456"""
    while True:
        existing_ids = {r[0] for r in db.query(past_order_table.order_id).all()}
        order_id = f"ORD{uuid.uuid4().hex[:6].upper()}"
        if order_id not in existing_ids:
            return order_id


@router_past_order.post("/past_order/add")
async def add_past_order(
    order: PastOrderCreate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        # ✅ Validate user from token
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ Check if product exists
        product = db.query(product_table).filter(product_table.pro_id == order.pro_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # ✅ Create new past order
        new_order = past_order_table(
            order_id=await generate_order_id(db),
            user_id=user.user_id,
            pro_id=order.pro_id,
            quantity=order.quantity,
            total_amount=order.total_amount,
            payment_status=order.payment_status or "Pending",
            delivery_address=order.delivery_address,
            city=order.city,
            pincode=order.pincode,
            landmark=order.landmark,
            delivery_type=order.delivery_type or "Home Delivery",
            status="Pending",
        )

        db.add(new_order)
        
        # ✅ Delete the product from cart after order is placed
        cart_item = db.query(cart_table).filter(
            cart_table.user_id == user.user_id,
            cart_table.pro_id == order.pro_id
        ).first()
        
        if cart_item:
            db.delete(cart_item)
        
        db.commit()
        return {
            "message": "✅ Order placed successfully",
            "order_id": new_order.order_id,
            "cart_item_removed": bool(cart_item)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error placing order: {str(e)}")


# 📦 View user's past orders (with product details)
@router_past_order.get("/past_order/view")
async def view_past_orders(
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        # ✅ Verify user is authenticated
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # ✅ Get ALL orders joined with product details AND user details
        orders = (
            db.query(past_order_table, product_table, user_table)
            .join(product_table, past_order_table.pro_id == product_table.pro_id)
            .join(user_table, past_order_table.user_id == user_table.user_id)
            .order_by(past_order_table.order_date.desc())
            .all()
        )

        if not orders:
            return {"message": "No orders found"}

        order_data = [
            {
                "order_id": o.past_order_table.order_id,
                "product_id": o.product_table.pro_id,
                "user_id": o.past_order_table.user_id,
                "user_phoneno": o.user_table.user_number,
                "user_email": o.user_table.user_email,
                "user_name": o.user_table.user_name,
                "product_name": o.product_table.product_name,
                "product_img": o.product_table.product_Img,
                "price_per_item": float(o.product_table.price),
                "quantity": o.past_order_table.quantity,
                "total_amount": o.past_order_table.total_amount,
                "payment_status": o.past_order_table.payment_status,
                "status": o.past_order_table.status,
                "delivery_type": o.past_order_table.delivery_type,
                "delivery_address": o.past_order_table.delivery_address,
                "city": o.past_order_table.city,
                "pincode": o.past_order_table.pincode,
                "landmark": o.past_order_table.landmark,
                "order_date": o.past_order_table.order_date,
            }
            for o in orders
        ]

        return {"past_orders": order_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error viewing past orders: {str(e)}")
    
# 🔄 Update Payment Status and Order Status Only
@router_past_order.patch("/past_order/update-status/{order_id}")
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    """
    Update only payment_status and/or order status
    
    Allowed values:
    - payment_status: "Pending", "Successfully"
    - status: "Pending", "Out for Delivery", "Delivered"
    """
    try:
        # Validate user
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Find the order
        order = db.query(past_order_table).filter(
            past_order_table.order_id == order_id,
            past_order_table.user_id == user.user_id
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Update only the provided fields
        update_count = 0
        if status_update.payment_status is not None:
            order.payment_status = status_update.payment_status.value
            update_count += 1
        
        if status_update.status is not None:
            order.status = status_update.status.value
            update_count += 1

        if update_count == 0:
            raise HTTPException(
                status_code=400, 
                detail="At least one status field must be provided"
            )

        db.commit()
        db.refresh(order)

        return {
            "message": "✅ Order status updated successfully",
            "order_id": order.order_id,
            "payment_status": order.payment_status,
            "status": order.status
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating order status: {str(e)}"
        )


# ✏️ Update order delivery details (only for Pending orders)
@router_past_order.put("/past_order/update/{order_id}")
async def update_past_order(
    order_id: str,
    update_data: PastOrderUpdate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        order = db.query(past_order_table).filter(
            past_order_table.order_id == order_id,
            past_order_table.user_id == user.user_id,
            past_order_table.status == "Pending"
        ).first()

        if not order:
            raise HTTPException(
                status_code=404, 
                detail="Order not found or cannot be modified (only Pending orders can be updated)"
            )

        for key, value in update_data.dict(exclude_unset=True).items():
            setattr(order, key, value)

        db.commit()
        return {"message": "✅ Order details updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating order: {str(e)}")


# 📋 Get available status options
@router_past_order.get("/past_order/status-options")
async def get_status_options():
    """Get all available status options for orders"""
    return {
        "payment_status_options": [status.value for status in PaymentStatus],
        "order_status_options": [status.value for status in OrderStatus]
    }


# ❌ Delete past order (only for testing/admin)
@router_past_order.delete("/past_order/delete/{order_id}")
async def delete_past_order(
    order_id: str,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        order = db.query(past_order_table).filter(
            past_order_table.order_id == order_id,
            past_order_table.user_id == user.user_id
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        db.delete(order)
        db.commit()
        return {"message": "🗑️ Order deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting order: {str(e)}")