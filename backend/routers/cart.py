from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.DB import get_DB
from schema.cart_schema import CartCreate, CartUpdate
from models.cart_table import cart_table
from models.product import product_table
from models.user import user_table
from services.user import user_Authorization
from services.Emailservice import send_email
import uuid
import random

router_cart = APIRouter()

async def generate_idno_cart(db: Session):
    """Generate a unique cart ID like CART123456"""
    while True:
        all_carts = db.query(cart_table.cart_id).all()
        existing_ids = {c[0] for c in all_carts}
        random_number = random.randint(100000, 999999)
        cart_id = f"CART{random_number}"

        if cart_id not in existing_ids:
            return cart_id


@router_cart.post("/cart/add")
async def add_to_cart(
    cart_item: CartCreate,
    db: Session = Depends(get_DB),
    token: object = Depends(user_Authorization())
):
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token, email missing")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user.user_id

        product = db.query(product_table).filter(product_table.pro_id == cart_item.pro_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        price = float(product.price)

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
        subject = "Cart Updated Successfully"
        body = f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Cart Updated</title>
</head>

<body style="margin:0; padding:24px; background:#f4f6f8; -webkit-text-size-adjust:none;">
  <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="width:100%; max-width:680px; margin:0 auto;">
    <tr>
      <td style="padding:16px 8px;">
        
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #eceff1;">

          <tr>
            <td style="padding:20px 24px; border-bottom:1px solid #f1f3f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="https://res.cloudinary.com/dosahgtni/image/upload/v1762153393/Ellectra_w01wap.png" width="80" alt="Store logo" style="display:block; border:0;"/>
                  </td>
                  <td style="text-align:right; vertical-align:middle; color:#6b7280; font-size:13px;">
                    <span style="display:inline-block; padding:6px 10px; border-radius:6px; background:#f3f4f6;">Order update</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px 8px 24px;">
              <h1 style="margin:0; font-size:20px; color:#0f172a; font-weight:700;">Hello {user.user_name},</h1>
              <p style="margin:8px 0 0 0; color:#334155; font-size:15px; line-height:1.4;">
                Your cart has been updated.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius:10px; border:1px solid #eef2f6;">
                <tr>

                  <td style="width:120px; padding:12px; vertical-align:top;">
                    <img src="{product.product_Img}" alt="{product.product_name}" width="96" style="display:block; border-radius:8px; object-fit:cover;">
                  </td>

                  <td style="padding:12px; vertical-align:top;">
                    <h3 style="margin:0 0 6px 0; font-size:16px; color:#0f172a;">{product.product_name}</h3>

                    <p style="margin:0 0 10px 0; color:#64748b; font-size:14px;">
                      Quantity: <strong style="color:#0f172a;">{cart_item.quantity}</strong>
                    </p>

                    <p style="margin:0 0 10px 0; color:#0f172a; font-size:16px; font-weight:700;">
                      Price per item: ₹{price}
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:8px;">
                          <a href="https://www.ellectra.in/cart" style="background:#0ea5e9; color:#ffffff; border-radius:8px; text-decoration:none; display:inline-block; padding:10px 14px; font-size:14px;">
                            View Cart
                          </a>
                        </td>
                        <td>
                          <a href="https://www.ellectra.in/cart" style="background:#f3f4f6; color:#0f172a; border-radius:8px; text-decoration:none; display:inline-block; padding:10px 14px; font-size:14px;">
                            Checkout
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 24px 22px 24px;">
              <p style="margin:0; color:#334155; font-size:14px; line-height:1.5;">
                Thank you for shopping with us!
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#fbfdff; padding:14px 24px; border-top:1px solid #f1f3f5; color:#64748b; font-size:13px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>Need help? <a href="mailto:support@example.com" style="color:#0ea5e9; text-decoration:none;">support@example.com</a></td>
                  <td style="text-align:right;">
                    <a href="#" style="color:#64748b; text-decoration:none; margin-right:8px;">Unsubscribe</a>
                    <span style="color:#cbd5e1;">•</span>
                    <a href="#" style="color:#64748b; text-decoration:none; margin-left:8px;">Privacy</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        await send_email(to_email=user_email, subject=subject, body=body)
        return {"message": f"✅ {msg}"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router_cart.get("/cart/view")
async def view_cart(db: Session = Depends(get_DB), token: object = Depends(user_Authorization())):
    try:
        user_email = token.get("email")
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(user_table).filter(user_table.user_email == user_email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user.user_id

        cart_items = (
            db.query(cart_table, product_table)
            .join(product_table, cart_table.pro_id == product_table.pro_id)
            .filter(cart_table.user_id == user_id)
            .all()
        )

        if not cart_items:
            return {"message": "Your cart is empty"}

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
