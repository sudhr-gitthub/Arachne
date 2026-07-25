from pydantic import BaseModel, Field
from typing import List

class NodeBase(BaseModel):
    id: str = Field(..., description="Unique node identifier")
    label: str = Field(..., description="Display label for the node")
    group: int = Field(..., description="Entity group: 1=Suspect, 2=Phone, 3=Vehicle, 4=FIR")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk score (0-100)")

class NodeCreate(NodeBase):
    pass

class NodeResponse(NodeBase):
    class Config:
        from_attributes = True

class EdgeBase(BaseModel):
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    relationship: str = Field(..., description="Relationship type (e.g. Called, Drives)")

class EdgeCreate(EdgeBase):
    pass

class EdgeResponse(EdgeBase):
    id: str

    class Config:
        from_attributes = True

class GraphPayload(BaseModel):
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]
