from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    
    profile = relationship("Profile", back_populates="owner", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    skills = Column(Text, default="")
    experience = Column(Text, default="")
    education = Column(Text, default="")
    location = Column(String, default="")
    position = Column(String, default="")
    recommendations_data = Column(Text, nullable=True)
    
    last_login_date = Column(Date, nullable=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    
    owner = relationship("User", back_populates="profile")

class GameScore(Base):
    __tablename__ = "game_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game_name = Column(String, index=True)
    score = Column(Integer, default=0)
    played_at = Column(DateTime(timezone=True), server_default=func.now())
