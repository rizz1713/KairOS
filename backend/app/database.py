import os
from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "kairos.db")

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProcessHistory(Base):
    __tablename__ = "process_history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pid = Column(Integer, index=True)
    process_name = Column(String(255), index=True)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    priority = Column(Integer)
    status = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class CPUHistory(Base):
    __tablename__ = "cpu_history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cpu_usage = Column(Float)
    process_count = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class MemoryHistory(Base):
    __tablename__ = "memory_history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    memory_usage = Column(Float)
    available_memory = Column(Float)  # In MB
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_type = Column(String(100))
    predicted_value = Column(String(100))
    model_name = Column(String(100))
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recommendation_type = Column(String(100))
    recommendation = Column(String(100))
    reason = Column(Text)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
