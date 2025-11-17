from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/shoutouts", tags=["Shoutouts"])


# -----------------------------
# CREATE SHOUTOUT
# -----------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_shoutout(
    shoutout: schemas.ShoutoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    new_shoutout = models.Shoutout(
        sender_id=current_user.id,
        message=shoutout.message,
    )
    db.add(new_shoutout)
    db.commit()
    db.refresh(new_shoutout)

    for r_id in shoutout.recipient_ids:
        db.add(models.ShoutoutRecipient(
            shoutout_id=new_shoutout.id,
            recipient_id=r_id,
        ))

    db.commit()

    return {"message": "Shoutout created successfully", "id": new_shoutout.id}


# -----------------------------
# GET ALL SHOUTOUTS
# -----------------------------
@router.get("/", response_model=List[schemas.ShoutoutResponse])
def get_all_shoutouts(db: Session = Depends(get_db)):

    shoutouts = (
        db.query(models.Shoutout)
        .options(
            joinedload(models.Shoutout.sender),
            joinedload(models.Shoutout.recipients)
                .joinedload(models.ShoutoutRecipient.recipient),
        )
        .order_by(models.Shoutout.created_at.desc())
        .all()
    )

    # 🔥 Precompute comment counts
    comment_counts_raw = (
        db.query(models.Comment.shoutout_id, func.count(models.Comment.id))
        .group_by(models.Comment.shoutout_id)
        .all()
    )
    comment_counts = {sid: cnt for sid, cnt in comment_counts_raw}

    result = []
    for s in shoutouts:
        result.append(
            schemas.ShoutoutResponse(
                id=s.id,
                message=s.message,
                sender=s.sender,
                created_at=s.created_at,
                recipients=[
                    schemas.RecipientOut(
                        id=r.recipient.id,
                        name=r.recipient.name,
                        department=r.recipient.department,
                    ) for r in s.recipients
                ],
                comments_count=comment_counts.get(s.id, 0),  # ✅ WORKING COUNT
            )
        )

    return result


# -----------------------------
# GET SINGLE SHOUTOUT
# -----------------------------
@router.get("/{shoutout_id}", response_model=schemas.ShoutoutResponse)
def get_shoutout(shoutout_id: int, db: Session = Depends(get_db)):

    s = (
        db.query(models.Shoutout)
        .options(
            joinedload(models.Shoutout.sender),
            joinedload(models.Shoutout.recipients)
                .joinedload(models.ShoutoutRecipient.recipient),
        )
        .filter(models.Shoutout.id == shoutout_id)
        .first()
    )

    if not s:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    # Count comments
    comment_count = (
        db.query(func.count(models.Comment.id))
        .filter(models.Comment.shoutout_id == shoutout_id)
        .scalar()
    ) or 0

    return schemas.ShoutoutResponse(
        id=s.id,
        message=s.message,
        sender=s.sender,
        created_at=s.created_at,
        recipients=[
            schemas.RecipientOut(
                id=r.recipient.id,
                name=r.recipient.name,
                department=r.recipient.department,
            ) for r in s.recipients
        ],
        comments_count=comment_count,  # ✅ WORKING COUNT
    )


# -----------------------------
# DELETE SHOUTOUT
# -----------------------------
@router.delete("/{shoutout_id}")
def delete_shoutout(
    shoutout_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):

    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()

    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    if current_user.role != "admin" and shoutout.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete")

    db.delete(shoutout)
    db.commit()

    return {"message": "Shoutout deleted successfully"}
