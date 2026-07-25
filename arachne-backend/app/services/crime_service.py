from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.repositories.crime_repository import district_repo, station_repo, category_repo, record_repo
from app.models import CrimeRecord, CrimeCategory, CrimeLocation, District, PoliceStation, ActivityLog, Notification, User

class CrimeService:
    def log_activity(self, db: Session, user_id: Optional[str], action: str, details: str):
        log = ActivityLog(user_id=user_id, action=action, details=details)
        db.add(log)
        db.commit()

    def create_notification(self, db: Session, user_id: str, message: str):
        notif = Notification(user_id=user_id, message=message)
        db.add(notif)
        db.commit()

    def create_crime_record(
        self,
        db: Session,
        *,
        lat: float,
        lng: float,
        category_name: str,
        time_shift: str,
        description: str,
        reporter_id: Optional[str] = None
    ) -> CrimeRecord:
        # 1. Resolve Category
        cat = category_repo.get_by_name(db, category_name)
        if not cat:
            cat = CrimeCategory(name=category_name, description=f"Registry category: {category_name}")
            db.add(cat)
            db.flush()

        # 2. Find precinct station to link to location
        dist = db.query(District).first()
        if not dist:
            dist = District(name="Central", description="Default HQ district")
            db.add(dist)
            db.flush()
        station = db.query(PoliceStation).filter(PoliceStation.district_id == dist.id).first()
        if not station:
            station = PoliceStation(name="Central Station Precinct", district_id=dist.id, address="HQ central")
            db.add(station)
            db.flush()

        # 3. Create crime location
        location = CrimeLocation(lat=lat, lng=lng, address="Operator GPS Coordinate", station_id=station.id)
        db.add(location)
        db.flush()

        # 4. Create Crime Record
        record = CrimeRecord(
            category_id=cat.id,
            location_id=location.id,
            time_shift=time_shift,
            description=description,
            reporter_id=reporter_id
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # Log action telemetry
        self.log_activity(db, reporter_id, "CREATE_CRIME_RECORD", f"Created record ID: {record.id} in Category: {category_name}")
        
        # Broadcast notification for high risk categories
        if category_name in ["Armed Robbery", "Assault"]:
            users = db.query(User).all()
            for user in users:
                self.create_notification(db, user.id, f"ALERT: High risk {category_name} reported at ({lat}, {lng})")

        return record

    def list_crime_records(
        self,
        db: Session,
        *,
        category: str = "All",
        shift: str = "All",
        district: str = "All",
        search: Optional[str] = None,
        sort_by: str = "date",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 100
    ) -> Tuple[List[CrimeRecord], int]:
        return record_repo.search_records(
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

crime_service = CrimeService()
