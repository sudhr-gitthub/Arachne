import uuid
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class CrimeCategory(Base):
    __tablename__ = "crime_categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, index=True, nullable=False) # e.g. Armed Robbery, Cyber Fraud, Assault, Theft
    description = Column(String(255), nullable=True)

    records = relationship("CrimeRecord", back_populates="category_rel")
    predictions = relationship("CrimePrediction", back_populates="predicted_category")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, index=True, nullable=False) # e.g. Central, North, South, East, West
    description = Column(String(255), nullable=True)

    stations = relationship("PoliceStation", back_populates="district")

class PoliceStation(Base):
    __tablename__ = "police_stations"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="RESTRICT"), nullable=False)
    address = Column(String(255), nullable=True)

    district = relationship("District", back_populates="stations")
    locations = relationship("CrimeLocation", back_populates="station")

class CrimeLocation(Base):
    __tablename__ = "crime_locations"

    id = Column(Integer, primary_key=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    station_id = Column(Integer, ForeignKey("police_stations.id", ondelete="SET NULL"), nullable=True)

    station = relationship("PoliceStation", back_populates="locations")
    records = relationship("CrimeRecord", back_populates="location_rel")

class CrimeRecord(Base):
    __tablename__ = "crime_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id = Column(Integer, ForeignKey("crime_categories.id", ondelete="RESTRICT"), nullable=False)
    location_id = Column(Integer, ForeignKey("crime_locations.id", ondelete="CASCADE"), nullable=False)
    time_shift = Column(String(50), nullable=False) # "Day" or "Night"
    date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    description = Column(String(1000), nullable=True)
    reporter_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category_rel = relationship("CrimeCategory", back_populates="records")
    location_rel = relationship("CrimeLocation", back_populates="records")

    @property
    def category(self) -> str:
        return self.category_rel.name if self.category_rel else "Theft"

    @property
    def lat(self) -> float:
        return self.location_rel.lat if self.location_rel else 12.9716

    @property
    def lng(self) -> float:
        return self.location_rel.lng if self.location_rel else 77.5946

class CrimePrediction(Base):
    __tablename__ = "crime_predictions"

    id = Column(Integer, primary_key=True)
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    predicted_category_id = Column(Integer, ForeignKey("crime_categories.id", ondelete="RESTRICT"), nullable=False)
    risk_score = Column(Float, nullable=False)

    predicted_category = relationship("CrimeCategory", back_populates="predictions")

class CrimeHotspot(Base):
    __tablename__ = "crime_hotspots"

    id = Column(String(50), primary_key=True) # e.g. ZONE-ALPHA, ZONE-BRAVO
    coordinates_json = Column(String(4000), nullable=False) # JSON list coordinates
    risk_level = Column(String(50), nullable=False) # e.g. Critical, High
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
