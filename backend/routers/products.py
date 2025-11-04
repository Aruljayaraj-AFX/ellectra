from fastapi import APIRouter, HTTPException, Request,Depends,Query
from authlib.integrations.starlette_client import OAuth
from models.user import user_table
from database.DB import get_DB
from dotenv import load_dotenv
from services.product import get_pro_pag,get_pro_detail,get_cat_pag,get_cat_detail,all_cat

router_product=APIRouter()

@router_product.get("/pag_cat_info")
async def get_pag_cat_handle(db=Depends(get_DB)):
    return await get_cat_pag(db)

@router_product.get("/cat_info")
async def get_pro_handle(pagination:int,db=Depends(get_DB)):
    return await get_cat_detail(pagination,db)

@router_product.get("/pag_pro_info")
async def get_pag_pro_handle(db=Depends(get_DB),categories_id: str = Query(..., alias="catgories_id")):
    return await get_pro_pag(db,categories_id)

@router_product.get("/pro_info")
async def get_cat_handle(pagination:int,catgories_id:str,db=Depends(get_DB)):
    return await get_pro_detail(pagination,catgories_id,db)

@router_product.get("all_cart")
async def get_all_cat_name(db=Depends(get_DB)):
    return await all_cat(db)

@router_product.get("all_products")
async def get_all_pro_name(db=Depends(get_DB)):
    return await all_pro(db)