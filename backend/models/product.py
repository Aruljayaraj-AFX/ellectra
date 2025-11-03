from sqlalchemy import Column,String,BigInteger,DateTime,func,ForeignKey
from sqlalchemy.orm import declarative_base,relationship
from .catgories import Base

class product_table(Base):
    __tablename__ = "product_info"
    pro_id=Column(String,primary_key=True,index=True)
    cat_id=Column(String,ForeignKey("catgories_info.cat_id"),nullable=False,index=True)
    product_name=Column(String,nullable=False)
    product_Img=Column(String,nullable=False)
    product_description=Column(String,nullable=False)
    price=Column(String,nullable=False)
    created_by = Column(DateTime,default=func.now())
    catgories = relationship("catgories_table", backref="products")