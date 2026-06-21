from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

# --- Password Reset Schemas ---
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# --- Profile Schemas ---
class ProfileBase(BaseModel):
    skills: str = ""
    experience: str = ""
    education: str = ""
    location: str = ""
    position: str = ""
    recommendations_data: Optional[str] = None
    last_login_date: Optional[date] = None
    current_streak: int = 0
    longest_streak: int = 0

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- AI Recommendation Schemas ---
class ResumeUploadResponse(BaseModel):
    extracted_text: str
    skills_found: str
    experience_found: str

class CareerRecommendationResponse(BaseModel):
    analysis: str
    matched_roles: list[str]
    gap_analysis: str
    course_recommendations: list[dict] # Future guidance
    potential_recruiters: list[str]    # Potential hirers based on level

# --- Game Schemas ---
class GameScoreCreate(BaseModel):
    game_name: str
    score: int

class GameScore(GameScoreCreate):
    id: int
    user_id: int
    played_at: datetime

    class Config:
        from_attributes = True

# --- Chatbot Schemas ---
class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    messages: list[ChatMessage]
