from fastapi import HTTPException,Request,Depends,status
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from models.user import user_table
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import random
import os
from utils.security_token import hashword,decode
from datetime import datetime,timedelta
from database.DB import get_DB
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
user_SECRET_KEY = str(os.getenv("SECRT_KEY"))
ALGORITHM = str(os.getenv("ALGORITHM"))


async def generate_idno(generate_id):
    while True:
        random_number = random.randint(100000,999999)
        id = "USER"+str(random_number)
        if random_number not in generate_id:
            return id 
        
async def access_token(email,fullname):
    try:
        expire=datetime.utcnow()+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)
        payload={
            "email":email,
            "fullname":fullname,
            "exp":expire
        }
        return hashword(payload)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Token generation error: {str(e)}")

async def user_new(email,username,db):
    try:
        all_user = db.query(user_table).all()
        existing_ids = {client.user_id for client in all_user}
        user_id = await generate_idno(existing_ids)
        new_cli = user_table(user_id=user_id,user_email=email,user_name=username)
        db.add(new_cli)
        db.commit()
        db.refresh(new_cli)
        token = await access_token(email,username)
        return token
    except HTTPException:
        raise  

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
class user_Authorization(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(user_Authorization, self).__init__(auto_error=auto_error)
    async def __call__(self, request: Request , db:Session = Depends(get_DB)):
        credentials: HTTPAuthorizationCredentials = await super(user_Authorization, self).__call__(request)
        if not credentials:
            raise HTTPException(status_code=401, detail="Invalid authorization code")
        try:
            token = decode(credentials.credentials)
            return token  
        except Exception as e:
            print("Token decode error:", e)
            raise HTTPException(status_code=401, detail="Invalid or expired token")

async def user_Detail(token, db):
    try:
        result = db.query(user_table).filter(user_table.user_email == token["email"]).first()
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")

        return {
            "user_name": result.user_name,
            "user_email": result.user_email,
            "user_phone_no": result.user_number,
            "user_doorno": result.user_door_no,
            "user_address": result.user_address,
            "user_city": result.user_city,
            "user_pincode": result.user_pincode,
            "Landmark": result.Landmark
        }

    except HTTPException as e:
        raise e

    except SQLAlchemyError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Database error: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,detail=f"Unexpected error: {repr(e)}")
    
async def user_detail_info(user_data,token,db):
    try:
        user = db.query(user_table).filter(user_table.user_email == token["email"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        update_data = user_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return {
            "message": "User details updated successfully",
            "updated_user": {
                "user_name": user.user_name,
                "user_email": user.user_email,
                "user_phone_no": user.user_number,
                "user_doorno": user.user_door_no,
                "user_address": user.user_address,
                "user_city": user.user_city,
                "user_pincode": user.user_pincode,
                "Landmark": user.Landmark
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {repr(e)}"
        )
    
async def user_Acc_delete(token: dict, db: Session):
    try:
        user = db.query(user_table).filter(user_table.user_email == token["email"]).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        db.delete(user)
        db.commit()
        return {"message": "User account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while deleting user: {repr(e)}"
        )