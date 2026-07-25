from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt
from typing import Optional

from app.database import get_db
from app.config import settings
from app.utils import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models import User, Role, ActivityLog
from app.schemas.user import UserCreate, UserResponse, Token
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RoleUpdate(BaseModel):
    role: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db_role = db.query(Role).filter(Role.name == user_in.role).first()
    if not db_role:
        db_role = Role(name=user_in.role, description=f"{user_in.role} Clearance Level")
        db.add(db_role)
        db.commit()
        db.refresh(db_role)

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        name=user_in.name,
        role_id=db_role.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log user registration in Audit Logs
    log = ActivityLog(
        user_id=new_user.id,
        action="Register User",
        details=f"Registered new user account: {new_user.email} with clearance level {user_in.role}"
    )
    db.add(log)
    db.commit()

    return new_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Audit log login action
    log = ActivityLog(
        user_id=user.id,
        action="Login",
        details="User successfully authenticated and generated security tokens"
    )
    db.add(log)
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, role=user.role, expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token = create_refresh_token(subject=user.email, role=user.role)
    
    # Set HTTP-Only Cookie with Secure, SameSite Lax, and Expiry configurations
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,          # Forces cookie transmission over HTTPS
        samesite="lax",       # Mitigation against CSRF attacks
        max_age=7 * 24 * 3600 # 7 days
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not refresh_token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    # Generate new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, role=user.role, expires_delta=access_token_expires
    )
    
    # Rotate refresh token to prevent replay attacks
    new_refresh_token = create_refresh_token(subject=user.email, role=user.role)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )
    
    # Log token refresh in Audit Logs
    log = ActivityLog(
        user_id=user.id,
        action="Token Refresh",
        details="Generated new access and rotated refresh token"
    )
    db.add(log)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clear the refresh token cookie
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    
    # Log logout action in Audit Logs
    log = ActivityLog(
        user_id=current_user.id,
        action="Logout",
        details="User successfully logged out and cleared session"
    )
    db.add(log)
    db.commit()
    
    return {"detail": "Successfully logged out from system session"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/role", response_model=UserResponse)
def update_role(
    role_in: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if role_in.role not in ["SHO", "Commissioner", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Clearance level must be SHO, Commissioner, or Analyst"
        )
    db_role = db.query(Role).filter(Role.name == role_in.role).first()
    if not db_role:
        db_role = Role(name=role_in.role, description=f"{role_in.role} Clearance Level")
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
    current_user.role_id = db_role.id
    db.commit()
    db.refresh(current_user)
    
    # Log clearance update in Audit Logs
    log = ActivityLog(
        user_id=current_user.id,
        action="Update Clearance",
        details=f"Clearance level changed to: {role_in.role}"
    )
    db.add(log)
    db.commit()
    
    return current_user
