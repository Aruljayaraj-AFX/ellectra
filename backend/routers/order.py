from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import Index
from database.DB import get_DB
from models.order_table import past_order_table
from models.product import product_table
from models.user import user_table
from services.user import user_Authorization
from services.Emailservice import send_email
from schema.order_schema import PastOrderCreate, PastOrderUpdate
from models.cart_table import cart_table
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
import uuid
from functools import lru_cache

router_past_order = APIRouter()

class PaymentStatus(str, Enum):
    PENDING = "Pending"
    SUCCESSFULLY = "Successfully"

class OrderStatus(str, Enum):
    PENDING = "Pending"
    OUT_FOR_DELIVERY = "Out for Delivery"
    DELIVERED = "Delivered"

class OrderStatusUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    status: Optional[OrderStatus] = None
    
    class Config:
        from_attributes = True

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
        product_rows_html = ""
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        product_ids = [item.pro_id for item in order.items]
        products = db.query(product_table).filter(
            product_table.pro_id.in_(product_ids)
        ).all()
        
        product_dict = {p.pro_id: p for p in products}
        
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
            product_rows_html += f"""
        <tr>
            <td style="padding:10px; border-bottom:1px solid #eee; width:80px;">
                <img src="{product.product_Img}" width="60" height="60"
                     style="border-radius:6px; object-fit:cover;">
            </td>

            <td style="padding:10px; border-bottom:1px solid #eee;">
                <strong>{product.product_name}</strong><br>
                Quantity: {item.quantity}<br>
                Price per item: ₹{price_per_item}
            </td>

            <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
                <strong>₹{item_total}</strong>
            </td>
        </tr>
    """

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

        removed_cart_items = db.query(cart_table).filter(
            cart_table.user_id == user.user_id,
            cart_table.pro_id.in_(product_ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        subject = f"Order Placed Successfully - Order #{order_id}"

        
     
        body = f"""
        <!doctype html>
        <html>
        <body style="font-family:Arial; background:#f7f7f7; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:10px;">
            
            <div style="text-align:center;">
                <img src="https://res.cloudinary.com/dosahgtni/image/upload/v1762153393/Ellectra_w01wap.png" width="80">
                <h2 style="color:#111;">Thank you for your order, {user.user_name}!</h2>
                <p>Your order has been placed successfully.</p>
            </div>

            <h3>Order Details</h3>

            <table style="width:100%; border-collapse:collapse;">
                {product_rows_html}
            </table>

            <h2 style="text-align:right; margin-top:20px;">
                Total: ₹{total_amount}
            </h2>

            <h3>Delivery Address</h3>
            <p>
                {order.delivery_address},<br>
                {order.city} - {order.pincode}<br>
                Landmark: {order.landmark}
            </p>

            <p style="margin-top:30px;">
                Thank you for shopping with <strong>Ellectra</strong>!  
            </p>

        </div>

        </body>
        </html>
        """

        await send_email(to_email=user_email, subject=subject, body=body)

        subjectticket = f"Order vathi iruku iyya - Order #{order_id}"

        bodyticket = f"""
        <!doctype html>
        <html>
        <body style="font-family:Arial; background:#f7f7f7; padding:20px;">
        
        <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:10px;">
            
            <div style="text-align:center;">
                <img src="https://res.cloudinary.com/dosahgtni/image/upload/v1762153393/Ellectra_w01wap.png" width="80">
                <h2 style="color:#111;">Order by {user.user_name}!</h2>
                <p>customer contact : {user.user_number}</p>
                <p>customer email : {user.user_email}</p>
            </div>

            <h3>Order Details</h3>

            <table style="width:100%; border-collapse:collapse;">
                {product_rows_html}
            </table>

            <h2 style="text-align:right; margin-top:20px;">
                Total: ₹{total_amount}
            </h2>

            <h3>Delivery Address</h3>
            <p>
                {order.delivery_address},<br>
                {order.city} - {order.pincode}<br>
                Landmark: {order.landmark}
            </p>
        </div>

        </body>
        </html>
        """
        await send_email(to_email="ellectra2025@gmail.com", subject=subjectticket, body=bodyticket)
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

@router_past_order.get("/past_order/view")
async def view_past_orders(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
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

        offset = (page - 1) * limit

        query = db.query(past_order_table)
        orders = (db.query(past_order_table).order_by(past_order_table.order_date.desc()).offset(offset).limit(limit).all())
        total_count = query.count()

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

        all_product_ids = set()
        for order in orders:
            for item in order.items:
                all_product_ids.add(item["pro_id"])
    
        products = db.query(product_table).filter(
            product_table.pro_id.in_(all_product_ids)
        ).all()
        
        product_dict = {p.pro_id: p for p in products}

        user_ids = set(order.user_id for order in orders)
        users = db.query(user_table).filter(
            user_table.user_id.in_(user_ids)
        ).all()
        
        user_dict = {u.user_id: u for u in users}

        order_data = []
        for order in orders:
            order_user = user_dict.get(order.user_id)
            
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
                "user_phoneno": order_user.user_number if order_user else None,
                "user_email": order_user.user_email if order_user else None,
                "user_name": order_user.user_name if order_user else "Unknown User",
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


@router_past_order.patch("/past_order/update-status/{order_id}")
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
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

        order = db.query(past_order_table).filter(
            past_order_table.order_id == order_id,
            past_order_table.user_id == user.user_id
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

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


@router_past_order.get("/past_order/status-options")
async def get_status_options():
    """Get all available status options for orders"""
    return {
        "payment_status_options": [status.value for status in PaymentStatus],
        "order_status_options": [status.value for status in OrderStatus]
    }


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