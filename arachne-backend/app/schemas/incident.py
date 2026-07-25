from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class IncidentBase(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    category: str = Field(..., description="Crime Category (e.g. Theft, Assault)")
    time_shift: str = Field(..., description="Shift: Day or Night")
    description: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentResponse(IncidentBase):
    id: str
    reporter_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
