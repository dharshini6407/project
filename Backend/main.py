# Backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import auth, shoutouts, comments, reactions, reports, admin

# --------------------------------------
# CREATE DATABASE TABLES
# --------------------------------------
models.Base.metadata.create_all(bind=engine)

# --------------------------------------
# INIT APP
# --------------------------------------
app = FastAPI(
    title="BragBoard API 🚀",
    version="1.0.0",
    description="Backend API for the BragBoard employee recognition system."
)

# --------------------------------------
# CORS CONFIG  ✅ FINAL FIXED VERSION
# --------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],       # Allow all HTTP methods
    allow_headers=["*"],       # ⭐ REQUIRED so Authorization header is NOT blocked
)

# --------------------------------------
# REGISTER ROUTERS (ORDER DOES NOT MATTER)
# --------------------------------------
app.include_router(auth.router)         # Login, register, tokens
app.include_router(shoutouts.router)    # Posting & listing shoutouts
app.include_router(comments.router)     # Comments CRUD
app.include_router(reactions.router)    # Reactions
app.include_router(reports.router)      # Reporting shoutouts
app.include_router(admin.router)        # Admin-level moderation

# --------------------------------------
# ROOT ENDPOINT
# --------------------------------------
@app.get("/", tags=["Root"])
def read_root():
    return {
        "status": "BragBoard API is running successfully 🚀",
        "version": "1.0.0",
        "message": "Welcome to the BragBoard API!",
        "available_routes": {
            "Auth": [
                "/auth/register",
                "/auth/login",
                "/auth/me",
                "/auth/refresh",
            ],
            "Shoutouts": [
                "/shoutouts",
                "/shoutouts/{id}",
            ],
            "Comments": [
                "/comments/{shoutout_id}",
                "/comments/{comment_id}/flag"
            ],
            "Reactions": [
                "/reactions/{shoutout_id}",
            ],
            "Reports": [
                "/reports/{shoutout_id}",
            ],
            "Admin": [
                "/admin/users",
                "/admin/users/{id}/role",
                "/admin/users/{id}/active",
                "/admin/users/{id}/block",
                "/admin/shoutouts/{id}",
                "/admin/comments",
                "/admin/comments/flagged",
                "/admin/comments/{id}",
                "/admin/reports",
            ]
        }
    }
