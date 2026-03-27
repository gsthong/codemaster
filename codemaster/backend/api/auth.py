from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging

from ..db.database import get_db
from ..models import User
from ..core.security import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: str
    streak: int
    created_at: datetime
    class Config:
        from_attributes = True

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "Username already taken")
    
    user = User(
        email=req.email,
        username=req.username,
        hashed_password=hash_password(req.password),
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, 
        user_id=user.id, 
        username=user.username, 
        role=user.role
    )

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == form.username) | (User.username == form.username)
    ).first()
    
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email/username or password"
        )
    
    user.last_active = datetime.utcnow()
    db.commit()
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token, 
        user_id=user.id, 
        username=user.username, 
        role=user.role
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/wecode-connect")
async def connect_wecode(
    wecode_token: str, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    current_user.wecode_token = wecode_token
    db.commit()
    return {"message": "Wecode connected successfully"}
