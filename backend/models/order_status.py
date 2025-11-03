from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from .user import Base
from .product import product_table

class order_tracking_status(Base):
    __tablename__ = "order_tracking_status"

    track_id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("past_order_info.order_id"), nullable=False)

    status = Column(String, nullable=False)  # e.g., "Placed", "Packed", "Shipped", "Delivered"
    remarks = Column(String, nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship
    order = relationship("past_order_table", backref="tracking_updates")
