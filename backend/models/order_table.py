from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from .user import Base

class past_order_table(Base):
    __tablename__ = "past_order_info"

    order_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user_info.user_id"), nullable=False)
    items = Column(JSON, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_status = Column(String, nullable=False, default="Pending")
    status = Column(String, nullable=True, default="Pending")
    delivery_address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    landmark = Column(String, nullable=True)
    delivery_type = Column(String, nullable=False, default="Home Delivery")
    order_date = Column(DateTime, default=func.now())
    user = relationship("user_table", backref="past_orders")