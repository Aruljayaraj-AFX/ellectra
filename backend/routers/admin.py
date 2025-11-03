from fastapi import FastAPI, File, UploadFile, Form, Depends,APIRouter
from fastapi.responses import JSONResponse
import cloudinary
import cloudinary.uploader
from models.catgories import catgories_table
from models.product import product_table
from services.user import user_Authorization
from database.DB import get_DB
from sqlalchemy.orm import Session
from schema.product_schema import Product
from services.admin_operation import new_catgoerie,edit_catgories,delete_catgories,get_catgories,new_product,edit_product,delete_product,get_product
from typing import Optional

router_admin = APIRouter()

@router_admin.post("/new_catgories")
async def new_catgoeries_handle(
    catgories_name: str = Form(...),
    catgories_img: UploadFile = File(...),token:object=Depends(user_Authorization()),db=Depends(get_DB)):
    try:
        catgories_link = cloudinary.uploader.upload(catgories_img.file)
        catgories_link = catgories_link.get("secure_url")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return await new_catgoerie(catgories_name,catgories_link,token,db)

@router_admin.put("/edit_catgories")
async def edit_catgories_handle(cat_id: Optional[str] = Form(None),
    catgories_name: str = Form(...),
    catgories_img: UploadFile = File(...),
    token:object=Depends(user_Authorization()),
    db=Depends(get_DB)):
    try:
        catgories_link = cloudinary.uploader.upload(catgories_img.file)
        catgories_link = catgories_link.get("secure_url")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return await edit_catgories(cat_id,catgories_name,catgories_link,token,db)

@router_admin.delete("/delete_catgories")
async def delete_catgories_handle(catgories_id:str,token:object=Depends(user_Authorization()),db=Depends(get_DB)):
    return await  delete_catgories(catgories_id,token,db)

@router_admin.get("/get_catgories")
async def get_catgories_handle(catgories_id:str,token:object=Depends(user_Authorization()),db=Depends(get_DB)):
    return await get_catgories(catgories_id,token,db)

@router_admin.post("/new_product", summary="Add new product")
async def new_product_handle( 
    cat_id: str = Form(...),
    product_name: str = Form(...),
    product_description: str = Form(...),
    price: str = Form(...),
    product_img: UploadFile = File(...),
    token: object = Depends(user_Authorization()),
    db: Session = Depends(get_DB)):
    try:
        product_link = cloudinary.uploader.upload(product_img.file)
        product_link = product_link.get("secure_url")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return await new_product(cat_id,product_name,product_description,price,product_link,token, db)


@router_admin.put("/edit_product", summary="Edit existing product")
async def edit_product_handle(
    pro_id:str = Form(...),
    cat_id: str = Form(...),
    product_name: str = Form(...),
    product_description: str = Form(...),
    price: str = Form(...),
    product_img: UploadFile = File(...),
    token: object = Depends(user_Authorization()),
    db: Session = Depends(get_DB)):
    try:
        product_link = cloudinary.uploader.upload(product_img.file)
        product_link = product_link.get("secure_url")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    return await edit_product(cat_id,product_name,product_description,price,product_link,token, db)


@router_admin.delete("/delete_product", summary="Delete product by ID")
async def delete_product_handle(product_id: str,token: object = Depends(user_Authorization()),db: Session = Depends(get_DB)):
    return await delete_product(product_id, token, db)


@router_admin.get("/get_product", summary="Get product by ID")
async def get_product_handle(product_id: str,token: object = Depends(user_Authorization()),db: Session = Depends(get_DB)):
    return await get_product(product_id, token, db)

cloudinary.config(
    cloud_name="dosahgtni",
    api_key="144565133742589",
    api_secret="p6iaACmy7AEr2QMzLtVnIu9QMuU"
)

