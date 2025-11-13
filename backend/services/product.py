from fastapi import HTTPException,Request,Depends,status
from models.product import product_table
from models.catgories import catgories_table
import math
from sqlalchemy import or_

async def get_cat_pag(db):
    try:
        total_rows = db.query(catgories_table).count()
        total_pages = total_rows/9
        return {"totalpages":total_pages}
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"retrival error: {repr(e)}")
    
async def get_cat_detail(pagination: int, db):
    try:
        if pagination < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Pagination value must be 1 or greater")
        page_size = 9
        offset_value = (pagination - 1) * page_size
        data = (
            db.query(catgories_table)
            .order_by(catgories_table.created_by.desc()) 
            .offset(offset_value)
            .limit(page_size)
            .all()
        )
        total_count = db.query(catgories_table).count()
        if not data:
            return {
                "message": "No categories found",
                "page": pagination,
                "total_records": total_count
            }
        return {
            "page": pagination,
            "page_size": page_size,
            "total_records": total_count,
            "data": [
                {
                    "category_id": row.cat_id,
                    "category_name": row.cat_name,
                    "category_img": row.cat_img,
                    "created_by": str(row.created_by),
                }
                for row in data
            ]
        }

    except HTTPException:
        raise  

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {repr(e)}"
        )  


async def get_pro_detail(catgories_id: str, db):
    try:
        data = (
            db.query(product_table)
            .filter(product_table.cat_id == catgories_id)
            .all()
        )

        if not data:
            return {"message": "No Data"}

        return {
            "data": [
                {
                    "product_id": row.pro_id,
                    "category_id": row.cat_id,
                    "product_name": row.product_name,
                    "description": row.product_description,
                    "price": row.price,
                    "product_img": row.product_Img,
                    "created_by": str(row.created_by),
                }
                for row in data
            ]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval error: {repr(e)}"
        )
    
async def all_cat(db):
    try:
        data = db.query(catgories_table).all()
        if not data:
            return {"message": "No Data"}

        return {
            "data": [
                {
                    "category_id": row.cat_id,
                    "category_name": row.cat_name,
                    "category_Img": row.cat_img
                }
                for row in data
            ]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval error: {repr(e)}"
        )
    
async def get_pro_pag(db):
    try:
        total_rows = db.query(product_table).count()
        page_size = 9
        total_pages = math.ceil(total_rows / page_size) 
        
        return {"total_pages": total_pages}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval error: {repr(e)}"
        )
    
async def get_pro_detail_paginated(page: int, db):
    try:
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page number must be 1 or greater"
            )

        page_size = 9  
        offset_value = (page - 1) * page_size

        data = (
            db.query(product_table)
            .order_by(product_table.created_by.desc())  
            .offset(offset_value)
            .limit(page_size)
            .all()
        )

        total_count = db.query(product_table).count()
        total_pages = math.ceil(total_count / page_size)

        if not data:
            return {
                "message": "No products found",
                "page": page,
                "page_size": page_size,
                "total_records": total_count,
                "total_pages": total_pages,
                "data": []
            }

        return {
            "page": page,
            "page_size": page_size,
            "total_records": total_count,
            "total_pages": total_pages,
            "data": [
                {
                    "product_id": row.pro_id,
                    "category_id": row.cat_id,
                    "product_name": row.product_name,
                    "description": row.product_description,
                    "price": row.price,
                    "product_img": row.product_Img,
                    "created_by": str(row.created_by),
                }
                for row in data
            ]
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {repr(e)}"
        )
    
async def search_products(query: str, db):
    try:
        if not query or query.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Search query cannot be empty"
            )

        data = (
            db.query(product_table)
            .filter(
                or_(
                    product_table.product_name.ilike(f"%{query}%"),
                    product_table.product_description.ilike(f"%{query}%"),
                )
            )
            .order_by(product_table.created_by.desc())
            .all()
        )

        if not data:
            return {"message": f"No products found matching '{query}'"}

        return {
            "query": query,
            "total_results": len(data),
            "data": [
                {
                    "product_id": row.pro_id,
                    "category_id": row.cat_id,
                    "product_name": row.product_name,
                    "description": row.product_description,
                    "price": row.price,
                    "product_img": row.product_Img,
                    "created_by": str(row.created_by),
                }
                for row in data
            ],
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search error: {repr(e)}"
        )