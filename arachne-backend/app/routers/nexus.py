from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import GraphNode, GraphEdge
from app.schemas.nexus import GraphPayload, NodeCreate, NodeResponse, EdgeCreate, EdgeResponse

router = APIRouter(prefix="/nexus", tags=["Nexus Intelligence Graph"])

def seed_graph_structures(db: Session):
    nodes = [
        GraphNode(id="S1", label="Vikram Malhotra (Main Suspect)", group=1, risk_score=95.5),
        GraphNode(id="S2", label="Amit Shah (Associate)", group=1, risk_score=78.2),
        GraphNode(id="S3", label="Rohan Joshi (Under Surveillance)", group=1, risk_score=62.0),
        GraphNode(id="S4", label="Karan Singhal (Logistics)", group=1, risk_score=48.1),
        GraphNode(id="S5", label="Sanjay Dutt (Informant/Suspect)", group=1, risk_score=55.4),
        
        GraphNode(id="P1", label="+91 98765 43210 (Malhotra Burner)", group=2, risk_score=85.0),
        GraphNode(id="P2", label="+91 87654 32109 (Malhotra Personal)", group=2, risk_score=45.0),
        GraphNode(id="P3", label="+91 76543 21098 (Shah Burner)", group=2, risk_score=80.0),
        GraphNode(id="P4", label="+91 65432 10987 (Joshi Burner)", group=2, risk_score=60.0),
        GraphNode(id="P5", label="+91 54321 09876 (Dutt Burner)", group=2, risk_score=50.0),
        
        GraphNode(id="V1", label="KA-51-MD-9876 (Black SUV)", group=3, risk_score=90.0),
        GraphNode(id="V2", label="MH-12-AS-1284 (White Sedan)", group=3, risk_score=68.5),
        GraphNode(id="V3", label="DL-03-KS-4242 (Delivery Van)", group=3, risk_score=35.0),
        
        GraphNode(id="F1", label="FIR-2026/89 (Smuggling)", group=4, risk_score=92.0),
        GraphNode(id="F2", label="FIR-2026/102 (Conspiracy)", group=4, risk_score=75.0),
        GraphNode(id="F3", label="FIR-2026/145 (Extortion)", group=4, risk_score=58.0),
        GraphNode(id="F4", label="FIR-2026/188 (Cargo Theft)", group=4, risk_score=40.0),
    ]

    edges = [
        GraphEdge(source="S1", target="P1", relationship="Called"),
        GraphEdge(source="S1", target="P2", relationship="Called"),
        GraphEdge(source="S1", target="V1", relationship="Drives"),
        GraphEdge(source="S1", target="F1", relationship="Mentioned In"),
        GraphEdge(source="S1", target="F2", relationship="Mentioned In"),
        
        GraphEdge(source="S2", target="P3", relationship="Called"),
        GraphEdge(source="S2", target="V2", relationship="Drives"),
        GraphEdge(source="S2", target="F1", relationship="Mentioned In"),
        GraphEdge(source="S2", target="P1", relationship="Called"),
        GraphEdge(source="S1", target="P3", relationship="Called"),
        GraphEdge(source="P2", target="P3", relationship="Called"),
        
        GraphEdge(source="S3", target="P4", relationship="Called"),
        GraphEdge(source="S3", target="F3", relationship="Mentioned In"),
        GraphEdge(source="S3", target="P3", relationship="Called"),
        
        GraphEdge(source="S4", target="V3", relationship="Drives"),
        GraphEdge(source="S4", target="F4", relationship="Mentioned In"),
        GraphEdge(source="S4", target="P4", relationship="Called"),
        
        GraphEdge(source="S5", target="P5", relationship="Called"),
        GraphEdge(source="S5", target="F2", relationship="Mentioned In"),
        GraphEdge(source="S5", target="P1", relationship="Called"),
        
        GraphEdge(source="V1", target="F1", relationship="Mentioned In"),
        GraphEdge(source="V2", target="F3", relationship="Mentioned In"),
    ]

    for n in nodes:
        db.add(n)
    for e in edges:
        db.add(e)
    db.commit()

@router.get("/graph", response_model=GraphPayload)
def get_graph(db: Session = Depends(get_db)):
    nodes_count = db.query(GraphNode).count()
    if nodes_count == 0:
        seed_graph_structures(db)
        
    nodes = db.query(GraphNode).all()
    edges = db.query(GraphEdge).all()
    return {"nodes": nodes, "edges": edges}

@router.post("/nodes", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(node_in: NodeCreate, db: Session = Depends(get_db)):
    db_node = db.query(GraphNode).filter(GraphNode.id == node_in.id).first()
    if db_node:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Node with ID {node_in.id} already exists"
        )
    new_node = GraphNode(
        id=node_in.id,
        label=node_in.label,
        group=node_in.group,
        risk_score=node_in.risk_score
    )
    db.add(new_node)
    db.commit()
    db.refresh(new_node)
    return new_node

@router.post("/edges", response_model=EdgeResponse, status_code=status.HTTP_201_CREATED)
def create_edge(edge_in: EdgeCreate, db: Session = Depends(get_db)):
    source_exists = db.query(GraphNode).filter(GraphNode.id == edge_in.source).first()
    target_exists = db.query(GraphNode).filter(GraphNode.id == edge_in.target).first()
    if not source_exists or not target_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source or Target node does not exist in graph nodes database"
        )
    new_edge = GraphEdge(
        source=edge_in.source,
        target=edge_in.target,
        relationship=edge_in.relationship
    )
    db.add(new_edge)
    db.commit()
    db.refresh(new_edge)
    return new_edge
