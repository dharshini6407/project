# routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from .. import models, database
from ..security import get_current_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)

# -----------------------------
# SCHEMAS
# -----------------------------

class RoleUpdate(BaseModel):
    role: models.UserRole


# =============================================================
# ✅ GET ALL REPORTS WITH FULL JOIN DATA (NO CHANGE)
# =============================================================
@router.get("/reports")
def get_all_reports(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    reports = (
        db.query(models.Report)
        .join(models.Shoutout, models.Shoutout.id == models.Report.shoutout_id)
        .join(models.User, models.User.id == models.Report.reported_by)
        .add_entity(models.Shoutout)
        .add_entity(models.User)
        .all()
    )

    output = []
    for report, shoutout, reporter in reports:
        output.append({
            "id": report.id,
            "reason": report.reason,
            "created_at": report.created_at,

            "shoutout": {
                "id": shoutout.id,
                "message": shoutout.message,
                "sender": {
                    "id": shoutout.sender.id,
                    "name": shoutout.sender.name,
                    "department": shoutout.sender.department
                }
            },

            "reported_by": {
                "id": reporter.id,
                "name": reporter.name,
                "department": reporter.department
            }
        })

    return output


# =============================================================
# RESOLVE REPORT
# =============================================================
@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Report resolved (deleted)"}


# =============================================================
# USERS LIST
# =============================================================
@router.get("/users")
def get_all_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    return db.query(models.User).all()


# =============================================================
# UPDATE USER ROLE
# =============================================================
@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()

    return {"message": "User role updated"}


# =============================================================
# TOGGLE ACTIVE
# =============================================================
@router.patch("/users/{user_id}/active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()

    return {"message": "User active status toggled"}


# =============================================================
# DELETE USER
# =============================================================
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


# =============================================================
# DELETE SHOUTOUT
# =============================================================
@router.delete("/shoutouts/{shoutout_id}")
def delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    db.delete(shoutout)
    db.commit()

    return {"message": "Shoutout deleted successfully"}


# =============================================================
# ✅ UPDATED: ADMIN GET ALL COMMENTS (NOW RETURNS USER INFO)
# =============================================================
@router.get("/comments")
def admin_get_all_comments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    comments = (
        db.query(models.Comment)
        .order_by(models.Comment.created_at.desc())
        .all()
    )

    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,

            "user": {
                "id": c.user.id,
                "name": c.user.name,
                "email": c.user.email,
                "department": c.user.department
            } if c.user else None,

            "is_flagged": c.is_flagged,
            "flag_reason": c.flag_reason
        })

    return result


# =============================================================
# ✅ UPDATED: GET FLAGGED COMMENTS (FULL USER + FLAGGER INFO)
# =============================================================
@router.get("/comments/flagged")
def admin_get_flagged_comments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    comments = db.query(models.Comment).filter(models.Comment.is_flagged == True).all()

    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "content": c.content,
            "flag_reason": c.flag_reason,
            "created_at": c.created_at,

            "user": {
                "id": c.user.id,
                "name": c.user.name,
                "department": c.user.department
            } if c.user else None,

            "flagged_by": {
                "id": c.flagger.id,
                "name": c.flagger.name,
                "department": c.flagger.department
            } if c.flagger else None
        })

    return result


# =============================================================
# DELETE COMMENT
# =============================================================
@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}


# =============================================================
# BLOCK USER
# =============================================================
@router.post("/users/{user_id}/block")
def block_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()

    return {"message": "User blocked"}
