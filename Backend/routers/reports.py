from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .. import models, database
from ..security import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

# ----- SCHEMA FOR REPORT INPUT -----
class ReportCreate(BaseModel):
    reason: str


@router.post("/{shoutout_id}")
def report_shoutout(
    shoutout_id: int,
    payload: ReportCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):

    shoutout = db.query(models.Shoutout).filter(
        models.Shoutout.id == shoutout_id
    ).first()

    if not shoutout:
        raise HTTPException(status_code=404, detail="Shoutout not found")

    # Extract reason from JSON
    reason = payload.reason

    report = models.Report(
        shoutout_id=shoutout_id,
        reported_by=current_user.id,
        reason=reason
    )

    db.add(report)
    db.commit()

    return {"message": "Shoutout reported successfully"}
