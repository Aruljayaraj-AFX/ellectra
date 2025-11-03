from sqlalchemy import Column,String,BigInteger,DateTime,func
from sqlalchemy.orm import declarative_base
from .user import Base

class catgories_table(Base):
    __tablename__ = "catgories_info"
    cat_id=Column(String,primary_key=True,index=True)
    cat_name=Column(String,unique=True,nullable=False)
    cat_img=Column(String,nullable=False)
    created_by = Column(DateTime,default=func.now()) 