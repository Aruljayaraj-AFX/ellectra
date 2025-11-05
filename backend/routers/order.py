from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import Index
from database.DB import get_DB
from models.order_table import past_order_table
from models.product import product_table
from models.user import user_table
from services.user import user_Authorization
from schema.order_schema import PastOrderCreate, PastOrderUpdate
from models.cart_table import cart_table
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
import uuid
from functools import lru_cache

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

# 🆔 Generate Unique Order ID
async def generate_order_id(db: Session):
    """Generate a unique order ID like ORD123456"""
    while True:
        order_id = f"ORD{uuid.uuid4().hex[:6].upper()}"
        exists = db.query(past_order_table).filter(
            past_order_table.order_id == order_id
        ).first()
        if not exists:
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

        # ✅ Get all product IDs at once (batch query)
        product_ids = [item.pro_id for item in order.items]
        products = db.query(product_table).filter(
            product_table.pro_id.in_(product_ids)
        ).all()
        
        # Create product lookup dictionary
        product_dict = {p.pro_id: p for p in products}
        
        # ✅ Validate all products and calculate total
        total_amount = 0.0
        items_data = []

        for item in order.items:
            product = product_dict.get(item.pro_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.pro_id} not found")
            
            price_per_item = float(product.price)
            item_total = price_per_item * item.quantity
            total_amount += item_total
            
            items_data.append({
                "pro_id": item.pro_id,
                "quantity": item.quantity,
                "price_per_item": price_per_item,
                "item_total": item_total
            })

        # ✅ Create new past order with items as JSON
        order_id = await generate_order_id(db)
        new_order = past_order_table(
            order_id=order_id,
            user_id=user.user_id,
            items=items_data,
            total_amount=total_amount,
            payment_status=order.payment_status or "Pending",
            delivery_address=order.delivery_address,
            city=order.city,
            pincode=order.pincode,
            landmark=order.landmark,
            delivery_type=order.delivery_type or "Home Delivery",
            status="Pending",
        )
        db.add(new_order)

        # ✅ Delete products from cart after order is placed (batch delete)
        removed_cart_items = db.query(cart_table).filter(
            cart_table.user_id == user.user_id,
            cart_table.pro_id.in_(product_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        return {
            "message": "✅ Order placed successfully",
            "order_id": order_id,
            "total_items": len(items_data),
            "total_amount": total_amount,
            "cart_items_removed": removed_cart_items
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error placing order: {str(e)}")


# 📦 View user's past orders with PAGINATION (Optimized)
# 📦 View user's past orders with PAGINATION (Optimized)
@router_past_order.get("/past_order/view")
async def view_past_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by order status"),
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

        # ✅ Calculate offset for pagination
        offset = (page - 1) * limit

        # ✅ Build query with optional status filter - DON'T call .all() yet!
        query = db.query(past_order_table).all()
        
        if status:
            query = query.filter(past_order_table.status == status)
        
        # ✅ Get total count (for pagination info)
        total_count = query.count()
        
        # ✅ Get paginated orders - NOW call .all()
        orders = query.order_by(
            past_order_table.order_date.desc()
        ).offset(offset).limit(limit).all()

        if not orders:
            return {
                "message": "No orders found",
                "past_orders": [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total_items": 0,
                    "total_pages": 0,
                    "has_more": False
                }
            }

        # ✅ Get all unique product IDs from all orders (batch query)
        all_product_ids = set()
        for order in orders:
            for item in order.items:
                all_product_ids.add(item["pro_id"])
        
        # ✅ Fetch all products in one query
        products = db.query(product_table).filter(
            product_table.pro_id.in_(all_product_ids)
        ).all()
        
        # Create product lookup dictionary
        product_dict = {p.pro_id: p for p in products}

        # ✅ Build response data
        order_data = []
        for order in orders:
            # Enrich items with product details
            enriched_items = []
            for item in order.items:
                product = product_dict.get(item["pro_id"])
                
                enriched_items.append({
                    "pro_id": item["pro_id"],
                    "product_name": product.product_name if product else "Unknown Product",
                    "product_img": product.product_Img if product else None,
                    "quantity": item["quantity"],
                    "price_per_item": item["price_per_item"],
                    "item_total": item["item_total"],
                })

            order_data.append({
                "order_id": order.order_id,
                "user_id": order.user_id,
                "user_phoneno": user.user_number,
                "user_email": user.user_email,
                "user_name": user.user_name,
                "items": enriched_items,
                "total_items": len(enriched_items),
                "total_amount": order.total_amount,
                "payment_status": order.payment_status,
                "status": order.status,
                "delivery_type": order.delivery_type,
                "delivery_address": order.delivery_address,
                "city": order.city,
                "pincode": order.pincode,
                "landmark": order.landmark,
                "order_date": order.order_date,
            })

        # ✅ Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        has_more = page < total_pages

        return {
            "past_orders": order_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_count,
                "total_pages": total_pages,
                "has_more": has_more
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error viewing past orders: {str(e)}")

# 📦 View single order details (Optimized)
@router_past_order.get("/past_order/view/{order_id}")
async def view_order_details(
    order_id: str,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get order
        order = db.query(past_order_table).filter(
            past_order_table.order_id == order_id,
            past_order_table.user_id == user.user_id
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # ✅ Get all product IDs and fetch in one query
        product_ids = [item["pro_id"] for item in order.items]
        products = db.query(product_table).filter(
            product_table.pro_id.in_(product_ids)
        ).all()
        
        # Create product lookup dictionary
        product_dict = {p.pro_id: p for p in products}

        # Enrich items with product details
        enriched_items = []
        for item in order.items:
            product = product_dict.get(item["pro_id"])
            
            enriched_items.append({
                "pro_id": item["pro_id"],
                "product_name": product.product_name if product else "Unknown Product",
                "product_img": product.product_Img if product else None,
                "quantity": item["quantity"],
                "price_per_item": item["price_per_item"],
                "item_total": item["item_total"],
            })

        return {
            "order_id": order.order_id,
            "user_id": order.user_id,
            "user_phoneno": user.user_number,
            "user_email": user.user_email,
            "user_name": user.user_name,
            "items": enriched_items,
            "total_items": len(enriched_items),
            "total_amount": order.total_amount,
            "payment_status": order.payment_status,
            "status": order.status,
            "delivery_type": order.delivery_type,
            "delivery_address": order.delivery_address,
            "city": order.city,
            "pincode": order.pincode,
            "landmark": order.landmark,
            "order_date": order.order_date,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error viewing order: {str(e)}")

    
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


# 📊 Get order statistics (Optional - for dashboard)
@router_past_order.get("/past_order/stats")
async def get_order_stats(
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    """Get order statistics for the user"""
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get counts by status
        from sqlalchemy import func
        
        stats = db.query(
            past_order_table.status,
            func.count(past_order_table.order_id).label('count')
        ).filter(
            past_order_table.user_id == user.user_id
        ).group_by(past_order_table.status).all()
        
        total_orders = db.query(func.count(past_order_table.order_id)).filter(
            past_order_table.user_id == user.user_id
        ).scalar()
        
        total_spent = db.query(func.sum(past_order_table.total_amount)).filter(
            past_order_table.user_id == user.user_id
        ).scalar() or 0

        return {
            "total_orders": total_orders,
            "total_spent": float(total_spent),
            "by_status": {stat.status: stat.count for stat in stats}
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")