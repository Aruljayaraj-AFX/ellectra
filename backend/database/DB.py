from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os 
from dotenv import load_dotenv

load_dotenv()

DB_URL=str(os.getenv("DB_URL"))
engine=create_engine(DB_URL)
sessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)
session = sessionLocal()

def get_DB():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()