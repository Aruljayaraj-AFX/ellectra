from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
import os

# Your database URL
DATABASE_URL = os.getenv("DB_URL")

# Create engine with connection pooling settings
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Disable connection pooling for serverless
    # OR use these settings for connection pooling:
    # pool_size=5,           # Maximum number of connections to keep open
    # max_overflow=10,       # Maximum number of connections that can be opened beyond pool_size
    # pool_pre_ping=True,    # Verify connections before using them
    # pool_recycle=3600,     # Recycle connections after 1 hour
    # echo=False
)

# Add connection cleanup
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    connection_record.info['pid'] = os.getpid()

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    pid = os.getpid()
    if connection_record.info['pid'] != pid:
        connection_record.connection = connection_proxy.connection = None
        raise exc.DisconnectionError(
            "Connection record belongs to pid %s, "
            "attempting to check out in pid %s" %
            (connection_record.info['pid'], pid)
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_DB():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # Always close the connection