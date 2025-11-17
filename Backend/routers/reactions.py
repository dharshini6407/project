# Backend/routers/reactions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/reactions", tags=["Reactions"])

@router.post("/{shoutout_id}", status_code=status.HTTP_201_CREATED)
def add_reaction(
    shoutout_id: int,
    reaction: schemas.ReactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Add a reaction (like, clap, star) to a shoutout.
    """
    # Ensure the shoutout exists
    shoutout = db.query(models.Shoutout).filter(models.Shoutout.id == shoutout_id).first()
    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    # Create reaction
    new_reaction = models.Reaction(
        shoutout_id=shoutout_id,
        user_id=current_user.id,
        type=reaction.type
    )

    db.add(new_reaction)
    db.commit()
    db.refresh(new_reaction)

    return {"message": f"Reaction '{reaction.type}' added successfully"}
