from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.DB import get_DB
from schema.cart_schema import CartCreate, CartUpdate
from models.cart_table import cart_table
from models.product import product_table
from models.user import user_table
from services.user import user_Authorization
import uuid
import random

router_cart = APIRouter()

# 🆔 Generate Unique Cart ID
async def generate_idno_cart(db: Session):
    """Generate a unique cart ID like CART123456"""
    while True:
        all_carts = db.query(cart_table.cart_id).all()
        existing_ids = {c[0] for c in all_carts}
        random_number = random.randint(100000, 999999)
        cart_id = f"CART{random_number}"

        if cart_id not in existing_ids:
            return cart_id


# 🛒 Add product to cart
@router_cart.post("/cart/add")
async def add_to_cart(
    cart_item: CartCreate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        # ✅ Validate token
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token, email missing")

        # ✅ Fetch user info
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user.user_id

        # ✅ Fetch product info
        product = db.query(product_table).filter(product_table.pro_id == cart_item.pro_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        price = float(product.price)

        # ✅ Check if product already exists in user's cart
        existing_item = db.query(cart_table).filter(
            cart_table.user_id == user_id,
            cart_table.pro_id == cart_item.pro_id
        ).first()

        if existing_item:
            existing_item.quantity += cart_item.quantity
            existing_item.total_price = existing_item.quantity * price
            msg = "Item quantity updated in cart"
        else:
            new_cart = cart_table(
                cart_id=await generate_idno_cart(db),
                user_id=user_id,
                pro_id=cart_item.pro_id,
                quantity=cart_item.quantity,
                total_price=cart_item.quantity * price
            )
            db.add(new_cart)
            msg = "Item added to cart successfully"

        db.commit()
        return {"message": f"✅ {msg}"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# 📦 View user cart (with product details)
@router_cart.get("/cart/view")
async def view_cart(db: Session = Depends(get_DB), token: object = Depends(user_Authorization())):
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        # ✅ Get user_id
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user.user_id

        # ✅ Get cart items + product info
        cart_items = (
            db.query(cart_table, product_table)
            .join(product_table, cart_table.pro_id == product_table.pro_id)
            .filter(cart_table.user_id == user_id)
            .all()
        )

        if not cart_items:
            return {"message": "Your cart is empty"}

        # ✅ Format output
        cart_data = [
            {
                "cart_id": c.cart_table.cart_id,
                "product_id": c.product_table.pro_id,
                "product_name": c.product_table.product_name,
                "product_img": c.product_table.product_Img,
                "price_per_item": float(c.product_table.price),
                "quantity": c.cart_table.quantity,
                "total_price": c.cart_table.total_price,
            }
            for c in cart_items
        ]

        return {"cart": cart_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error viewing cart: {str(e)}")


# ✏️ Update cart item quantity
@router_cart.put("/cart/update/{cart_id}")
async def update_cart(
    cart_id: str,
    update_data: CartUpdate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        item = db.query(cart_table).filter(
            cart_table.cart_id == cart_id,
            cart_table.user_id == user.user_id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        # ✅ Recalculate total price using product price
        product = db.query(product_table).filter(product_table.pro_id == item.pro_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        item.quantity = update_data.quantity
        item.total_price = update_data.quantity * float(product.price)

        db.commit()
        return {"message": "✅ Cart updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating cart: {str(e)}")


# ❌ Delete cart item
@router_cart.delete("/cart/delete/{cart_id}")
async def delete_cart_item(
    cart_id: str,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        item = db.query(cart_table).filter(
            cart_table.cart_id == cart_id,
            cart_table.user_id == user.user_id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        db.delete(item)
        db.commit()
        return {"message": "🗑️ Item deleted from cart"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting cart item: {str(e)}")
