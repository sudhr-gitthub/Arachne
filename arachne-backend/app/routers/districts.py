from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models import District, PoliceStation
from app.routers.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/districts", tags=["Precinct Districts"])

class DistrictCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DistrictResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class StationCreate(BaseModel):
    name: str
    district_id: int
    address: Optional[str] = None

class StationResponse(BaseModel):
    id: int
    name: str
    district_id: int
    address: Optional[str] = None
    class Config:
        from_attributes = True

@router.get("", response_model=List[DistrictResponse])
def list_districts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(District).offset(skip).limit(limit).all()

@router.post("", response_model=DistrictResponse, status_code=status.HTTP_201_CREATED)
def create_district(
    district_in: DistrictCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin"]))
):
    existing = db.query(District).filter(District.name == district_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="District name already exists")
    dist = District(name=district_in.name, description=district_in.description)
    db.add(dist)
    db.commit()
    db.refresh(dist)
    return dist

@router.get("/stations", response_model=List[StationResponse])
def list_stations(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(PoliceStation)
    if district_id:
        query = query.filter(PoliceStation.district_id == district_id)
    return query.all()

@router.post("/stations", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(
    station_in: StationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Police Officer"]))
):
    # Verify district exists
    dist = db.query(District).filter(District.id == station_in.district_id).first()
    if not dist:
        raise HTTPException(status_code=404, detail="District not found")
    st = PoliceStation(
        name=station_in.name,
        district_id=station_in.district_id,
        address=station_in.address
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return st
