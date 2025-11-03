from fastapi import HTTPException,Request,Depends,status
from models.product import product_table
from models.catgories import catgories_table

async def get_cat_pag(db):
    try:
        total_rows = db.query(catgories_table).count()
        total_pages = total_rows/20
        return {"totalpages":total_pages}
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"retrival error: {repr(e)}")
    
async def get_cat_detail(pagination: int, db):
    try:
        if pagination < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Pagination value must be 1 or greater")
        page_size = 10
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


async def get_pro_pag(db):
    try:
        total_rows = db.query(product_table).count()
        total_pages = total_rows/20
        return {"totalpages":total_pages}
    except HTTPException as e:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"retrival error: {repr(e)}")
    
async def get_pro_detail(pagination: int,catgories_id:str,db):
    try:
        offset_value = (pagination - 1) * 12

        data = (
            db.query(product_table)
            .filter(product_table.cat_id == catgories_id)
            .offset(offset_value)
            .limit(12)
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
                    "product_img":row.product_Img,
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