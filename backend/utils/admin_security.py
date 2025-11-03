from fastapi import HTTPException,status
from dotenv import load_dotenv
import os

load_dotenv()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")

def verify_admin_access(token):
    user_email = token["email"]

    if not user_email or user_email != ADMIN_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Admin access only")