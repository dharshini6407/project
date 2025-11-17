# Backend/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from passlib.hash import argon2 # Make sure argon2-cffi is installed
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# --- Helper functions using Argon2 ---

def hash_password(password: str) -> str:
    """
    Hashes the password using Argon2.
    """
    return argon2.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password against its Argon2 hash.
    """
    try:
        return argon2.verify(plain_password, hashed_password)
    except Exception:
        # Catches verification failures (mismatch, invalid hash format)
        return False


# --- Routes ---

@router.post("/register", status_code=status.HTTP_201_CREATED) # Added status code
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user. Hashes the password using Argon2.
    Returns a success message.
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        department=user.department,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # Changed response to be more informative, consider returning user data (schemas.User)
    return {"message": f"User '{new_user.email}' registered successfully"}


@router.post("/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Logs in a user, verifies credentials, and returns access + refresh tokens.
    """
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}, # Standard header for auth errors
        )

    # Use functions from security.py to create tokens
    access_token = security.create_access_token({"sub": db_user.email})
    refresh_token = security.create_refresh_token({"sub": db_user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# --- ADDED THIS ENDPOINT ---
@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    """
    Protected route: Gets the details for the currently logged-in user.
    Requires a valid access token in the Authorization header.
    """
    return current_user
# -----------------------------


# --- Optional Refresh Token Endpoint ---
# Ensure security.py has decode_token and create_access_token
# Also consider adding refresh token rotation and storage
@router.post("/refresh", response_model=schemas.Token)
def refresh_access_token(refresh_token_data: schemas.RefreshTokenRequest, db: Session = Depends(get_db)): # Assuming a schema RefreshTokenRequest exists
    """
    Issues a new access token based on a valid refresh token.
    (Requires further implementation in security.py and potentially storing refresh tokens)
    """
    payload = security.decode_refresh_token(refresh_token_data.refresh_token) # Assuming decode_refresh_token exists
    if not payload:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Optional: Check if refresh token is revoked/valid in DB if you implement storage

    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access_token = security.create_access_token({"sub": email})
    # Optional: Implement refresh token rotation here
    
    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token_data.refresh_token, # Or new rotated token
        "token_type": "bearer"
    }