from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .user import Base
from .product import product_table


class cart_table(Base):
    __tablename__ = "cart_info"

    cart_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user_info.user_id"), nullable=False)
    pro_id = Column(String, ForeignKey("product_info.pro_id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("user_table", backref="cart_items")
    product = relationship("product_table", backref="cart_products")
