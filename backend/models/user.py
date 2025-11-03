from sqlalchemy import Column,String,BigInteger,DateTime,func
from sqlalchemy.orm import declarative_base

Base= declarative_base()

class user_table(Base):
    __tablename__ = "user_info"
    user_id=Column(String,primary_key=True,index=True)
    user_name=Column(String,nullable=False)
    user_email=Column(String,nullable=False,index=True)
    user_number=Column(BigInteger,nullable=True)
    user_door_no=Column(String,nullable=True)
    user_address=Column(String,nullable=True)
    user_city=Column(String,nullable=True)
    user_pincode=Column(String,nullable=True)
    Landmark=Column(String,nullable=True)
    created_by = Column(DateTime,default=func.now()) 