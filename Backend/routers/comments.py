# routers/comments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/comments", tags=["Comments"])


# -----------------------------------
#        ADD COMMENT
# -----------------------------------
@router.post("/{shoutout_id}", status_code=status.HTTP_201_CREATED, response_model=schemas.CommentResponse)
def add_comment(
    shoutout_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    new_comment = models.Comment(
        content=comment.content.strip(),
        user_id=current_user.id,
        shoutout_id=shoutout_id,
        created_at=datetime.utcnow(),
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    # 🔥 NEW: Count comments after adding
    comment_count = (
        db.query(models.Comment)
        .filter(models.Comment.shoutout_id == shoutout_id)
        .count()
    )

    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
        "comment_count": comment_count,  # 🔥 ADDED
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },
    }


# -----------------------------------
#        GET COMMENTS FOR A SHOUTOUT
# -----------------------------------
@router.get("/{shoutout_id}", response_model=list[schemas.CommentResponse])
def get_comments_for_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    comments = (
        db.query(models.Comment)
        .filter(models.Comment.shoutout_id == shoutout_id)
        .order_by(models.Comment.created_at.asc())
        .all()
    )

    return [
        {
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "user": {
                "id": c.user.id,
                "name": c.user.name,
                "email": c.user.email,
            },
        }
        for c in comments
    ]


# -----------------------------------
#        FLAG COMMENT
# -----------------------------------
@router.post("/{comment_id}/flag")
def flag_comment(
    comment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Reason is required")

    comment.flag_reason = reason
    comment.is_flagged = True
    comment.flagged_by = current_user.id
    comment.flagged_at = datetime.utcnow()

    db.commit()

    return {"message": "Comment flagged successfully"}
