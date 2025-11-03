from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import random
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from models.catgories import catgories_table
from models.product import product_table
from utils.admin_security import verify_admin_access

async def generate_idno_cat(generate_id):
    while True:
        random_number = random.randint(100000,999999)
        id = "CAT"+str(random_number)
        if random_number not in generate_id:
            return id 


async def generate_idno_pro(generate_id):
    while True:
        random_number = random.randint(100000,999999)
        id = "PRO"+str(random_number)
        if random_number not in generate_id:
            return id 

async def new_catgoerie(catgories_name,catgories_link, token, db: Session):
    verify_admin_access(token)
    try:
        existing_cat = db.query(catgories_table).filter(catgories_table.cat_name == catgories_name).first()
        if existing_cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Category already exists")
        all_cat = db.query(catgories_table).all()
        existing_ids = {cat.cat_id for cat in all_cat}
        user_id = await generate_idno_cat(existing_ids)
        new_cat = catgories_table(
            cat_id=user_id,
            cat_name=catgories_name,
            cat_img=catgories_link,
        )
        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)
        return {"message": "Category added successfully", "data": new_cat}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Database integrity error while adding category")
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Unexpected error: {str(e)}")


async def edit_catgories(cat_id,catgories_name,catgories_link, token, db: Session):
    verify_admin_access(token)
    try:
        cat = db.query(catgories_table).filter(catgories_table.cat_id == cat_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        duplicate = db.query(catgories_table).filter(catgories_table.cat_name.ilike(catgories_name),catgories_table.cat_id != cat_id).first()
        if duplicate:
            raise HTTPException(status_code=400,detail=f"Category name '{catgories_name}' already exists")
        cat.cat_name = catgories_name
        cat.cat_img = catgories_link
        db.commit()
        db.refresh(cat)
        return {"message": "Category updated successfully", "data": cat}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def delete_catgories(catgories_id: str, token, db: Session):
    verify_admin_access(token)
    try:
        cat = db.query(catgories_table).filter(catgories_table.cat_id == catgories_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        deleted_products = db.query(product_table).filter(product_table.cat_id == catgories_id).delete(synchronize_session=False)
        db.delete(cat)
        db.commit()
        return {
            "message": "Category deleted successfully",
            "deleted_products_count": deleted_products
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )    
    
async def get_catgories(catgories_id: str, token, db: Session):
    verify_admin_access(token)
    try:
        cat = db.query(catgories_table).filter(catgories_table.cat_id == catgories_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"data": cat}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

async def new_product(cat_id,product_name,product_description,price,product_link,token, db: Session):
    verify_admin_access(token)
    try:
        existing_pro = (db.query(product_table).filter(product_table.product_name == product_name).first())
        if existing_pro:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product already exists with the same name."
            )
        category_exists = (
            db.query(catgories_table).filter(catgories_table.cat_id == cat_id).first())
        if not category_exists:
            return f"Category ID '{cat_id}' not found. Please create it first."
        all_pro = db.query(product_table).all()
        existing_ids = {pro.pro_id for pro in all_pro}
        user_id = await generate_idno_pro(existing_ids)
        new_pro = product_table(
            pro_id=user_id,
            cat_id=cat_id,
            product_name=product_name,
            product_description=product_description,
            price=price,
            product_Img=product_link,
        )

        db.add(new_pro)
        db.commit()
        db.refresh(new_pro)
        return {
            "message": " Product added successfully",
            "data": {
                "product_id": new_pro.pro_id,
                "name": new_pro.product_name,
                "category": new_pro.cat_id,
                "price": new_pro.price,
                "description": new_pro.product_description,
                "image": new_pro.product_Img
            }
        }

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Integrity Error",
                "message": str(e.orig)
            }
        )

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Database Error",
                "message": str(e)
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Unexpected Error",
                "message": str(e)
            }
        )

async def edit_product(pro_id,cat_id,product_name,product_description,price,product_link,token, db: Session):
    verify_admin_access(token)
    try:
        pro = db.query(product_table).filter(product_table.pro_id == pro_id).first()
        if not pro:
            raise HTTPException(status_code=404, detail="Product not found")
        category_exists = (
            db.query(catgories_table).filter(catgories_table.cat_id == cat_id).first())
        if not category_exists:
            return f"Category ID '{cat_id}' not found. Please create it first."
        pro.cat_id = cat_id
        pro.product_name = product_name
        pro.product_description = product_description
        pro.price = price
        pro.product_Img = product_link
        db.commit()
        db.refresh(pro)
        return {"message": "Product updated successfully", "data": pro}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def delete_product(product_id: str, token, db: Session):
    verify_admin_access(token)
    try:
        pro = db.query(product_table).filter(product_table.pro_id == product_id).first()
        if not pro:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(pro)
        db.commit()
        return {"message": "Product deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


async def get_product(product_id: str, token, db: Session):
    verify_admin_access(token)
    try:
        pro = db.query(product_table).filter(product_table.pro_id == product_id).first()
        if not pro:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"data": pro}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

