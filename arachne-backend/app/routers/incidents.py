import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import CrimeRecord
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services.ml_services import calculate_dbscan_hotspots, calculate_kmeans_hotspots, calculate_hdbscan_hotspots
from app.services.crime_service import crime_service

router = APIRouter(prefix="/geo", tags=["Crime Hotspots Mapping"])

# Seeder helper for database persistence
def generate_initial_incidents(db: Session) -> List[CrimeRecord]:
    random.seed(42)
    categories_list = ['Armed Robbery', 'Cyber Fraud', 'Assault', 'Theft']
    shifts = ['Day', 'Night']
    center_lat, center_lng = 12.9716, 77.5946
    
    from app.models import District, PoliceStation, CrimeCategory, CrimeLocation
    # 1. Create Districts
    district_names = ['Central', 'North', 'South', 'East', 'West']
    districts = {}
    for name in district_names:
        dist = db.query(District).filter(District.name == name).first()
        if not dist:
            dist = District(name=name, description=f"{name} District Command")
            db.add(dist)
            db.flush()
        districts[name] = dist
        
    # 2. Create Police Stations
    stations = []
    for d_name, dist in districts.items():
        st = db.query(PoliceStation).filter(PoliceStation.name == f"{d_name} Precinct Station").first()
        if not st:
            st = PoliceStation(name=f"{d_name} Precinct Station", district_id=dist.id, address=f"Precinct HQ Address {d_name}")
            db.add(st)
            db.flush()
        stations.append(st)
        
    # 3. Create Crime Categories
    categories = {}
    for cat_name in categories_list:
        cat = db.query(CrimeCategory).filter(CrimeCategory.name == cat_name).first()
        if not cat:
            cat = CrimeCategory(name=cat_name, description=f"Classified registries for {cat_name}")
            db.add(cat)
            db.flush()
        categories[cat_name] = cat
        
    # 4. Generate Spatial-Temporal Records
    records_list = []
    for i in range(150):
        lat = center_lat + random.normalvariate(0, 0.015)
        lng = center_lng + random.normalvariate(0, 0.015)
        cat_name = random.choice(categories_list)
        shift = random.choice(shifts)
        
        station = random.choice(stations)
        location = CrimeLocation(lat=lat, lng=lng, address=f"Sector Grid Intersection {100 + i}", station_id=station.id)
        db.add(location)
        db.flush()
        
        rec = CrimeRecord(
            category_id=categories[cat_name].id,
            location_id=location.id,
            time_shift=shift,
            description=f"Automated incident sweep log ID INC-{1000 + i}"
        )
        db.add(rec)
        records_list.append(rec)
        
    db.commit()
    return records_list

@router.get("/incidents", response_model=List[IncidentResponse])
def get_incidents(
    category: Optional[str] = "All",
    shift: Optional[str] = "All",
    district: Optional[str] = "All",
    search: Optional[str] = None,
    sort_by: Optional[str] = "date",
    sort_order: Optional[str] = "desc",
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db)
):
    # Auto-seed if database is empty or has too few records for clustering
    count = db.query(CrimeRecord).count()
    if count < 10:
        generate_initial_incidents(db)

    records, _ = crime_service.list_crime_records(
        db,
        category=category,
        shift=shift,
        district=district,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    return records

@router.post("/incidents", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(incident_in: IncidentCreate, db: Session = Depends(get_db)):
    return crime_service.create_crime_record(
        db,
        lat=incident_in.lat,
        lng=incident_in.lng,
        category_name=incident_in.category,
        time_shift=incident_in.time_shift,
        description=incident_in.description
    )

@router.get("/predict-patrols")
def get_predictive_patrols(
    algorithm: str = "dbscan",
    eps: float = 0.012,
    min_samples: int = 5,
    n_clusters: int = 4,
    min_cluster_size: int = 5,
    db: Session = Depends(get_db)
):
    incidents = db.query(CrimeRecord).all()
    if len(incidents) < 10:
        incidents = generate_initial_incidents(db)
        
    try:
        if algorithm == "kmeans":
            zones = calculate_kmeans_hotspots(incidents, n_clusters=n_clusters)
        elif algorithm == "hdbscan":
            zones = calculate_hdbscan_hotspots(incidents, min_cluster_size=min_cluster_size)
        else:
            zones = calculate_dbscan_hotspots(incidents, eps=eps, min_samples=min_samples)
        return zones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot computation error: {str(e)}")
