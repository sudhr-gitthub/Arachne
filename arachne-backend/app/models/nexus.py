import uuid
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.database import Base

class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(String(50), primary_key=True) # e.g. S1, P1, V1, F1
    label = Column(String(255), nullable=False)
    group = Column(Integer, nullable=False) # 1=Suspect, 2=Phone, 3=Vehicle, 4=FIR
    risk_score = Column(Float, default=0.0)

class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(50), ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False)
    target = Column(String(50), ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False)
    relationship = Column(String(100), nullable=False) # e.g. Called, Drives, Mentioned In
