from dotenv import load_dotenv 
import os
from jose import jwt
from fastapi import HTTPException, status
from jwt import ExpiredSignatureError, InvalidTokenError

load_dotenv()

token_expiry_minutes = os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES')
algorithm = os.getenv('ALGORITHM')
secret_key = os.getenv('SECRET_KEY')

def hashword(token):
        return jwt.encode(token, secret_key , algorithm=algorithm)

def decode(token: str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload

    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Token has expired")

    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid token")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail=f"Token decode error: {str(e)}")