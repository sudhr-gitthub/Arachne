from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from app.repositories.base import BaseRepository
from app.models import CrimeRecord, CrimeCategory, CrimeLocation, District, PoliceStation

class DistrictRepository(BaseRepository[District]):
    def __init__(self):
        super().__init__(District)

    def get_by_name(self, db: Session, name: str) -> Optional[District]:
        return db.query(District).filter(District.name == name).first()

class PoliceStationRepository(BaseRepository[PoliceStation]):
    def __init__(self):
        super().__init__(PoliceStation)

    def get_by_district(self, db: Session, district_id: int) -> List[PoliceStation]:
        return db.query(PoliceStation).filter(PoliceStation.district_id == district_id).all()

class CrimeCategoryRepository(BaseRepository[CrimeCategory]):
    def __init__(self):
        super().__init__(CrimeCategory)

    def get_by_name(self, db: Session, name: str) -> Optional[CrimeCategory]:
        return db.query(CrimeCategory).filter(CrimeCategory.name == name).first()

class CrimeRecordRepository(BaseRepository[CrimeRecord]):
    def __init__(self):
        super().__init__(CrimeRecord)

    def search_records(
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
        query = db.query(CrimeRecord).join(CrimeRecord.category_rel).join(CrimeRecord.location_rel)

        # Filtering
        if category != "All":
            query = query.filter(CrimeCategory.name == category)
        if shift != "All":
            query = query.filter(CrimeRecord.time_shift == shift)
        if district != "All":
            query = query.join(CrimeLocation.station).join(PoliceStation.district).filter(District.name == district)

        # Searching
        if search:
            query = query.filter(CrimeRecord.description.like(f"%{search}%"))

        total_count = query.count()

        # Sorting
        if sort_by == "category":
            order_col = CrimeCategory.name
        elif sort_by == "date" or sort_by == "created_at":
            order_col = CrimeRecord.date
        else:
            order_col = CrimeRecord.date

        if sort_order == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        return query.all(), total_count

# Instantiated repositories for application use
district_repo = DistrictRepository()
station_repo = PoliceStationRepository()
category_repo = CrimeCategoryRepository()
record_repo = CrimeRecordRepository()
