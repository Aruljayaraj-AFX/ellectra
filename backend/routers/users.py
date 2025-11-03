from fastapi import APIRouter, HTTPException, Request,Depends
from authlib.integrations.starlette_client import OAuth
from models.user import user_table
from starlette.responses import RedirectResponse
from services.user import user_new,access_token,user_Authorization,user_Detail,user_detail_info,user_Acc_delete
from database.DB import get_DB
from dotenv import load_dotenv
import os
import json 
from schema.user_schema import UserUpdate

load_dotenv()

router_user = APIRouter()

@router_user.get("/security_check/")
async def read(token: object = Depends(user_Authorization())):
    return token

oauth = OAuth()
oauth.register(
    name="google",
    client_id=str(os.getenv("GOOGLE_CLINET_ID")),
    client_secret=str(os.getenv("GOOGLE_CLINET_SECRET")),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router_user.get("/users_google")
async def login_google(request:Request):
    redirect_url = request.url_for('authgoogle')
    return await oauth.google.authorize_redirect(request, redirect_url)

@router_user.get("auth/google/callback")
async def authgoogle(request:Request,db=Depends(get_DB)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token["userinfo"]
    email= user_info["email"]
    fullname= user_info["name"]
    try:
        user_check = db.query(user_table).filter(email == user_table.user_email).first()
        if not user_check :
            token = await user_new(email,fullname,db)
        else:
            token = await access_token(email,fullname)
        frontend_url = f"https://ellectra-6n63.vercel.app/?token={token}"
        return RedirectResponse(url=frontend_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router_user.get("/user_details")
async def user_detail_fetch(db=Depends(get_DB),token: object = Depends(user_Authorization())):
    return await user_Detail(token,db)

@router_user.put("/user_info_change")
async def user_detail_change(user_info:UserUpdate,db=Depends(get_DB),token:object=Depends(user_Authorization())):
    return await user_detail_info(user_info,token,db)

@router_user.delete("/user_delete")
async def user_delete(db=Depends(get_DB),token:object=Depends(user_Authorization())):
    return await user_Acc_delete(token,db)