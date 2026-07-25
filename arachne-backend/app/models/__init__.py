from app.database import Base
from app.models.core import Role, User, ActivityLog, Notification, Report, AnalyticsCache, ReportSchedule
from app.models.crime import CrimeCategory, District, PoliceStation, CrimeLocation, CrimeRecord, CrimePrediction, CrimeHotspot
from app.models.nexus import GraphNode, GraphEdge

# Keep Incident as an alias for CrimeRecord to ensure full backwards compatibility where needed
Incident = CrimeRecord

__all__ = [
    "Base",
    "Role",
    "User",
    "ActivityLog",
    "Notification",
    "Report",
    "AnalyticsCache",
    "ReportSchedule",
    "CrimeCategory",
    "District",
    "PoliceStation",
    "CrimeLocation",
    "CrimeRecord",
    "CrimePrediction",
    "CrimeHotspot",
    "GraphNode",
    "GraphEdge",
    "Incident"
]
