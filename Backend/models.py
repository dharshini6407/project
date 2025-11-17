import enum
from sqlalchemy import (
    Column, Integer, String, TIMESTAMP, Enum as SAEnum,
    Text, ForeignKey, Boolean, DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class UserRole(str, enum.Enum):
    employee = "employee"
    admin = "admin"


class ReactionType(str, enum.Enum):
    like = "like"
    clap = "clap"
    star = "star"


# ============================
# ---------- USERS -----------
# ============================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    department = Column(String(100))
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    joined_at = Column(TIMESTAMP, server_default=func.now())

    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)

    # Sent shoutouts
    sent_shoutouts = relationship(
        "Shoutout",
        back_populates="sender",
        cascade="all, delete"
    )

    # User's own comments
    comments = relationship(
        "Comment",
        back_populates="user",
        foreign_keys="Comment.user_id",
        cascade="all, delete"
    )

    # Reactions
    reactions = relationship(
        "Reaction",
        back_populates="user",
        cascade="all, delete"
    )

    # Reports made by user
    reports = relationship(
        "Report",
        back_populates="reporter",
        cascade="all, delete"
    )

    # Admin logs
    admin_logs = relationship(
        "AdminLog",
        back_populates="admin",
        cascade="all, delete"
    )

    # Comments flagged by this user
    flagged_comments = relationship(
        "Comment",
        foreign_keys="Comment.flagged_by",
        viewonly=True
    )


# ============================
# -------- SHOUTOUTS ---------
# ============================

class Shoutout(Base):
    __tablename__ = "shoutouts"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_hidden = Column(Boolean, default=False)

    sender = relationship("User", back_populates="sent_shoutouts")

    recipients = relationship(
        "ShoutoutRecipient",
        back_populates="shoutout",
        cascade="all, delete"
    )

    # COMMENTS FIXED — major requirement for count to work
    comments = relationship(
        "Comment",
        back_populates="shoutout",
        cascade="all, delete"
    )

    reactions = relationship(
        "Reaction",
        back_populates="shoutout",
        cascade="all, delete"
    )

    reports = relationship(
        "Report",
        back_populates="shoutout",
        cascade="all, delete"
    )


class ShoutoutRecipient(Base):
    __tablename__ = "shoutout_recipients"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"))
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    shoutout = relationship("Shoutout", back_populates="recipients")
    recipient = relationship("User")


# ============================
# -------- COMMENTS ----------
# ============================

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)

    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Flagging system
    flag_reason = Column(Text, nullable=True)
    is_flagged = Column(Boolean, default=False)
    flagged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    flagged_at = Column(DateTime, nullable=True)

    # Relationship: comment belongs to shoutout
    shoutout = relationship(
        "Shoutout",
        back_populates="comments"
    )

    # Relationship: comment belongs to user
    user = relationship(
        "User",
        back_populates="comments",
        foreign_keys=[user_id]
    )

    # Who flagged the comment
    flagger = relationship(
        "User",
        foreign_keys=[flagged_by]
    )


# ============================
# -------- REACTIONS ---------
# ============================

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(SAEnum(ReactionType, name="reaction_type"), nullable=False)

    shoutout = relationship("Shoutout", back_populates="reactions")
    user = relationship("User", back_populates="reactions")


# ============================
# --------- REPORTS ----------
# ============================

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    shoutout_id = Column(Integer, ForeignKey("shoutouts.id", ondelete="CASCADE"))
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    shoutout = relationship("Shoutout", back_populates="reports")
    reporter = relationship("User", back_populates="reports")


# ============================
# -------- ADMIN LOGS --------
# ============================

class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    action = Column(Text, nullable=False)
    target_id = Column(Integer, nullable=False)
    target_type = Column(String(100), nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now())

    admin = relationship("User", back_populates="admin_logs")
