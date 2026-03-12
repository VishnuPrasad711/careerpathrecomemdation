from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, date
import os
from dotenv import load_dotenv

# Load env variables before importing any inner services that use them
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

import models, schemas, auth, database
from ai_service import get_career_recommendations, extract_profile_from_resume, chat_with_coach, analyze_ats
import PyPDF2
import io

# Create DB tables
models.Base.metadata.create_all(bind=database.engine)

try:
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), "app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(profiles)")
    columns = [info[1] for info in cursor.fetchall()]
    if "recommendations_data" not in columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN recommendations_data TEXT")
    if "last_login_date" not in columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN last_login_date DATE")
    if "current_streak" not in columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN current_streak INTEGER DEFAULT 0")
    if "longest_streak" not in columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0")
        
    conn.commit()
    conn.close()
except Exception as e:
    print("DB migration error:", e)

app = FastAPI(title="AI Career Recommendation System")

# Configure CORS for our frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize empty profile
    new_profile = models.Profile(user_id=new_user.id)
    db.add(new_profile)
    db.commit()

    return new_user

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    if profile:
        today = date.today()
        if profile.last_login_date != today:
            if profile.last_login_date == today - timedelta(days=1):
                profile.current_streak = (profile.current_streak or 0) + 1
            else:
                profile.current_streak = 1
            if profile.current_streak > (profile.longest_streak or 0):
                profile.longest_streak = profile.current_streak
            profile.last_login_date = today
            db.commit()

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/profile", response_model=schemas.Profile)
def get_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    return profile

@app.put("/api/profile", response_model=schemas.Profile)
def update_profile(profile_update: schemas.ProfileUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.skills = profile_update.skills
    profile.experience = profile_update.experience
    profile.education = profile_update.education
    
    db.commit()
    db.refresh(profile)
    return profile

@app.post("/api/recommendations")
async def get_recommendations(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile or (not profile.skills and not profile.experience):
        raise HTTPException(status_code=400, detail="Profile is incomplete. Please add skills or experience first.")
    
    import json
    if profile.recommendations_data:
        return json.loads(profile.recommendations_data)
        
    recommendations = get_career_recommendations(
        profile.skills, profile.experience, profile.education
    )
    
    profile.recommendations_data = json.dumps(recommendations)
    db.commit()
    
    return recommendations


@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
            
        parsed_data = extract_profile_from_resume(text)
        
        return {
            "extracted_text": text[:500] + "...", # preview 
            "skills": parsed_data.get("skills", ""),
            "experience": parsed_data.get("experience", ""),
            "education": parsed_data.get("education", "")
        }
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail="Failed to process the uploaded resume.")

@app.post("/api/ats/check")
async def check_ats(job_description: str = Form(...), file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
            
        parsed_data = analyze_ats(text, job_description)
        return parsed_data
        
    except Exception as e:
        print(f"Error processing ATS check: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze resume against job description.")

@app.post("/api/chat")
async def chat_endpoint(request: schemas.ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    return {"reply": chat_with_coach(request.messages)}

@app.post("/api/games/scores", response_model=schemas.GameScore)
def save_game_score(score_data: schemas.GameScoreCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    new_score = models.GameScore(
        user_id=current_user.id,
        game_name=score_data.game_name,
        score=score_data.score
    )
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    return new_score

@app.get("/api/games/scores")
def get_user_scores(game_name: str = None, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    query = db.query(models.GameScore).filter(models.GameScore.user_id == current_user.id)
    if game_name:
        query = query.filter(models.GameScore.game_name == game_name)
    scores = query.order_by(models.GameScore.played_at.desc()).limit(10).all()
    return scores

@app.get("/api/notifications")
def get_notifications(current_user: models.User = Depends(auth.get_current_user)):
    # Mock data for demonstration purposes
    return [
        {
            "id": 1,
            "type": "jobfair",
            "title": "Virtual Tech Career Fair 2026",
            "message": "Top AI startups are hiring! Register to secure your spot.",
            "date": (date.today() + timedelta(days=2)).isoformat()
        },
        {
            "id": 2,
            "type": "interview",
            "title": "Mock Interview Invite",
            "message": "Your AI Coach has prepared a specialized Front-End Engineer interview for you.",
            "date": (date.today() + timedelta(days=1)).isoformat()
        }
    ]
