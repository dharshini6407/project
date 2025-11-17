from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from .models import UserRole, ReactionType


# =========================
# ----- USER SCHEMAS ------
# =========================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole


class User(UserBase):
    id: int
    role: UserRole

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ================================
# ----- SHOUTOUT SCHEMAS --------
# ================================

class RecipientOut(BaseModel):
    id: int
    name: str
    department: Optional[str] = None

    class Config:
        from_attributes = True


class ShoutoutBase(BaseModel):
    message: str


class ShoutoutCreate(ShoutoutBase):
    recipient_ids: List[int] = []


class ShoutoutResponse(ShoutoutBase):
    id: int
    sender: User
    recipients: List[RecipientOut]
    created_at: datetime
    comments_count: int   # ✅ REQUIRED & POPULATED IN ROUTER

    class Config:
        from_attributes = True


# ================================
# ----- COMMENT SCHEMAS ---------
# ================================

class CommentCreate(BaseModel):
    content: str


class CommentUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: Optional[str] = None

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    user: CommentUser     # ✅ FIXED: full user object (has email)
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ================================
# ----- REACTION SCHEMAS --------
# ================================

class ReactionCreate(BaseModel):
    type: ReactionType


class ReactionResponse(BaseModel):
    id: int
    shoutout_id: int
    user_id: int
    type: ReactionType

    class Config:
        from_attributes = True


# ============================
# ----- ADMIN SCHEMAS -------
# ============================

class UserAdmin(BaseModel):
    id: int
    name: str
    email: EmailStr
    department: Optional[str] = None
    role: UserRole
    is_active: bool
    is_blocked: bool

    class Config:
        from_attributes = True


class CommentAdmin(BaseModel):
    id: int
    content: str
    created_at: datetime
    flag_reason: Optional[str] = None
    is_flagged: Optional[bool] = None
    user: CommentUser
    flagged_by: Optional[CommentUser] = None
    flagged_at: Optional[datetime] = None

    class Config:
        from_attributes = True
