from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import CrimeRecord, CrimePrediction, CrimeCategory
from app.routers.deps import get_current_user, RoleChecker
from app.services.ml_services import calculate_dbscan_hotspots, calculate_kmeans_hotspots, calculate_hdbscan_hotspots
from app.services.predictive_ml import train_crime_model, get_risk_prediction

router = APIRouter(prefix="/predictions", tags=["Predictions Engine"])

class PredictionResponse(BaseModel):
    id: int
    predicted_at: datetime
    location_lat: float
    location_lng: float
    predicted_category_id: int
    risk_score: float
    class Config:
        from_attributes = True

class PredictRequest(BaseModel):
    district: str
    category: str
    time_shift: str
    day_of_week: int
    month: int

class PredictResponse(BaseModel):
    risk_level: str
    probability: float
    patrol_strength: int
    risk_score: int
    explanation: str

@router.get("/patrols")
def get_predictive_patrols(
    algorithm: str = "dbscan",
    eps: float = 0.012,
    min_samples: int = 5,
    n_clusters: int = 4,
    min_cluster_size: int = 5,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Police Officer", "Analyst"]))
):
    incidents = db.query(CrimeRecord).all()
    try:
        if algorithm == "kmeans":
            zones = calculate_kmeans_hotspots(incidents, n_clusters=n_clusters)
        elif algorithm == "hdbscan":
            zones = calculate_hdbscan_hotspots(incidents, min_cluster_size=min_cluster_size)
        else:
            zones = calculate_dbscan_hotspots(incidents, eps=eps, min_samples=min_samples)
        
        # Log prediction runs
        cat = db.query(CrimeCategory).first()
        cat_id = cat.id if cat else 1
        
        for zone in zones:
            coords = zone["coordinates"]
            if coords:
                lat_mean = sum(pt[0] for pt in coords) / len(coords)
                lng_mean = sum(pt[1] for pt in coords) / len(coords)
                db_pred = CrimePrediction(
                     location_lat=lat_mean,
                     location_lng=lng_mean,
                     predicted_category_id=cat_id,
                     risk_score=0.85 if zone["risk_level"] == "Critical" else 0.60
                )
                db.add(db_pred)
        db.commit()
        return zones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot computation error: {str(e)}")

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(CrimePrediction).order_by(CrimePrediction.predicted_at.desc()).limit(limit).all()

@router.post("/train")
def train_prediction_model(
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Analyst"]))
):
    result = train_crime_model(db)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/predict", response_model=PredictResponse)
def execute_predictive_score(
    req: PredictRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        prediction = get_risk_prediction(
            db=db,
            district_name=req.district,
            category_name=req.category,
            shift=req.time_shift,
            day_of_week=req.day_of_week,
            month=req.month
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction runner error: {str(e)}")
