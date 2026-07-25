from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import GraphNode, GraphEdge, CrimeRecord, CrimeCategory, District, PoliceStation, CrimeLocation, CrimePrediction, Incident
from app.services.gemini import query_gemini

router = APIRouter(prefix="/ai/insights", tags=["Cognitive AI Insights"])

class SummaryRequest(BaseModel):
    node_id: str

class SummaryResponse(BaseModel):
    node_id: str
    summary: str

class ChatRequest(BaseModel):
    query: Optional[str] = None
    prompt: Optional[str] = None

class ChatResponse(BaseModel):
    query: str
    response: str
    sources: List[str]

def build_analytics_context(db: Session) -> str:
    """
    Queries real database models to construct a rich, structured context containing 
    actual metrics, timeline trends, district breakdowns, predictive hotspots, 
    and flagged entities.
    """
    incidents = db.query(CrimeRecord).all()
    total_incidents = len(incidents)
    
    # 1. Category breakdown
    cat_counts = {}
    for inc in incidents:
        cat_name = inc.category
        cat_counts[cat_name] = cat_counts.get(cat_name, 0) + 1
        
    # 2. District breakdown and detailed district-by-category metrics
    district_counts = {}
    district_category_counts = {}
    for inc in incidents:
        dist_name = "Unknown"
        if inc.location_rel and inc.location_rel.station and inc.location_rel.station.district:
            dist_name = inc.location_rel.station.district.name
            
        district_counts[dist_name] = district_counts.get(dist_name, 0) + 1
        
        if dist_name not in district_category_counts:
            district_category_counts[dist_name] = {}
        cat_name = inc.category
        district_category_counts[dist_name][cat_name] = district_category_counts[dist_name].get(cat_name, 0) + 1
        
    # 3. Shift breakdown
    shift_counts = {}
    for inc in incidents:
        shift_counts[inc.time_shift] = shift_counts.get(inc.time_shift, 0) + 1
        
    # 4. Monthly trends
    monthly_counts = {}
    for inc in incidents:
        if inc.date:
            month_str = inc.date.strftime("%B")
            monthly_counts[month_str] = monthly_counts.get(month_str, 0) + 1
            
    # 5. Computed Hotspots beats (DBSCAN default)
    try:
        from app.services.ml_services import calculate_dbscan_hotspots
        hotspots = calculate_dbscan_hotspots(incidents, eps=0.012, min_samples=5)
    except Exception:
        hotspots = []
        
    # 6. Flagged entities (graph suspects)
    nodes = db.query(GraphNode).all()
    
    # Compile text context
    lines = []
    lines.append(f"TOTAL INCIDENTS IN REGISTER: {total_incidents}")
    
    lines.append("\nINCIDENTS BY CRIME TYPE:")
    for cat, count in cat_counts.items():
        lines.append(f"- {cat}: {count} incidents")
        
    lines.append("\nINCIDENTS BY SECTOR DISTRICT:")
    for dist, count in district_counts.items():
        lines.append(f"- {dist} District: {count} incidents")
        
    lines.append("\nDETAILED DISTRICT CRIME BREAKDOWN:")
    for dist, cats in district_category_counts.items():
        cat_details = ", ".join([f"{k}: {v}" for k, v in cats.items()])
        lines.append(f"- {dist} District -> {cat_details}")
        
    lines.append("\nOPERATIONAL SHIFT DISTRIBUTION:")
    for shift, count in shift_counts.items():
        lines.append(f"- {shift} Shift: {count} incidents logged")
        
    lines.append("\nMONTHLY CRIME TIMELINE (TRENDS):")
    # Sort months by order of calendar months if possible
    month_order = {"January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6, 
                   "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12}
    sorted_months = sorted(monthly_counts.keys(), key=lambda m: month_order.get(m, 99))
    for month in sorted_months:
        lines.append(f"- {month}: {monthly_counts[month]} logged crimes")
        
    lines.append("\nPREDICTIVE TACTICAL HOTSPOTS (BEATS):")
    if hotspots:
        for zone in hotspots:
            lines.append(f"- Hotspot Beat {zone['id']}: Centroid={zone['centroid']}, Risk Level={zone['risk_level']}, Incident Density={zone['crime_count']}, Suggested Patrol Units={zone['patrol_suggested']}")
    else:
        lines.append("- No active multi-incident predictive hotspots mapped currently.")
        
    lines.append("\nFLAGGED SUSPECT ENTITIES (INTELLIGENCE NETWORK):")
    if nodes:
        for n in nodes:
            group_desc = ["Suspect", "Burner Phone", "Vehicle", "FIR"][n.group - 1] if 0 < n.group <= 4 else "Unknown"
            lines.append(f"- Entity ID={n.id}, Name='{n.label}', Class={group_desc}, Threat Factor={n.risk_score}%")
    else:
        lines.append("- No high-risk entities flagged in the intelligence registry.")
        
    return "\n".join(lines)

@router.post("/summary", response_model=SummaryResponse)
def get_node_summary(req: SummaryRequest, db: Session = Depends(get_db)):
    node = db.query(GraphNode).filter(GraphNode.id == req.node_id).first()
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Graph node with ID {req.node_id} not found"
        )
    
    incoming_edges = db.query(GraphEdge).filter(GraphEdge.target == req.node_id).all()
    outgoing_edges = db.query(GraphEdge).filter(GraphEdge.source == req.node_id).all()
    
    links_info = []
    for edge in incoming_edges:
        source_node = db.query(GraphNode).filter(GraphNode.id == edge.source).first()
        source_label = source_node.label if source_node else edge.source
        links_info.append(f"Connected from '{source_label}' ({edge.source}) via '{edge.relationship}'")
    for edge in outgoing_edges:
        target_node = db.query(GraphNode).filter(GraphNode.id == edge.target).first()
        target_label = target_node.label if target_node else edge.target
        links_info.append(f"Connected to '{target_label}' ({edge.target}) via '{edge.relationship}'")
        
    links_str = "\n".join(links_info) if links_info else "No direct links mapped."
 
    prompt = (
        "You are 'Arachne', an advanced tactical crime intelligence assistant.\n"
        f"Generate a professional, high-clearance tactical summary for the following intelligence network entity:\n\n"
        f"Entity ID: {node.id}\n"
        f"Name/Label: {node.label}\n"
        f"Group: {node.group} (1=Suspect, 2=Phone, 3=Vehicle, 4=FIR)\n"
        f"Risk/Threat Rating: {node.risk_score}%\n\n"
        f"Mapped Connectivity Links:\n"
        f"{links_str}\n\n"
        "Compile this summary in a concise, tactical format suitable for field commanders and commissioners. "
        "Highlight risk factors, associated channels, and direct connections. Keep the summary under 120 words. "
        "Strictly use the provided information and do not fabricate facts."
    )
    
    summary_text = query_gemini(prompt)
    return {"node_id": req.node_id, "summary": summary_text}

@router.post("/chat", response_model=ChatResponse)
def chat_with_data(req: ChatRequest, db: Session = Depends(get_db)):
    query = req.query or req.prompt
    if not query:
        raise HTTPException(
            status_code=400,
            detail="Either 'query' or 'prompt' request field must be provided."
        )
        
    query_lower = query.lower()
    sources = []
    
    # Check what data is being queried to add appropriate source tags
    if any(k in query_lower for k in ["incident", "robbery", "fraud", "theft", "assault", "crime", "trend", "month"]):
        sources.append("Incident Database Registry")
    if any(k in query_lower for k in ["district", "station", "precinct"]):
        sources.append("Precinct GIS Mapping")
    if any(k in query_lower for k in ["hotspot", "allocation", "patrol", "beat"]):
        sources.append("Clustering Hotspot Engine")
    if any(k in query_lower for k in ["suspect", "network", "node", "edge", "entity"]):
        sources.append("Intelligence Network Graphs")
        
    if not sources:
        sources.append("Arachne Cognitive Engine")
        
    # Build a robust, non-hallucinated context from real DB state
    context_str = build_analytics_context(db)
    
    system_instruction = (
        "You are 'Arachne', an advanced tactical crime intelligence assistant.\n"
        "Answer the operator's query based ONLY on the following real-time database context:\n\n"
        f"DATABASE CONTEXT:\n{context_str}\n\n"
        f"OPERATOR QUERY: {query}\n\n"
        "RULES FOR CONSTRUCTING RESPONSE:\n"
        "1. STRICTLY DO NOT HALLUCINATE. You must only use actual analytical numbers, trends, categories, and locations from the DATABASE CONTEXT above.\n"
        "2. If the context does not contain enough information to answer a query (e.g., querying a crime type or district not logged in the context), "
        "explicitly state that the requested data is not logged in the current database registry.\n"
        "3. Keep your answers concise, tactical, professional, and direct, suitable for law enforcement operations.\n"
        "4. If asked to 'predict next month', inspect the 'MONTHLY CRIME TIMELINE (TRENDS)' trend rates and provide a mathematical projection based purely on those numbers. State clearly that it is a projection based on the monthly trend.\n"
        "5. If asked to 'suggest patrol allocation', read the 'PREDICTIVE TACTICAL HOTSPOTS' risk levels and patrol suggestions, and recommend dispatching patrol units specifically to those hotspot centroids."
    )
    
    response_text = query_gemini(system_instruction)
    
    return {
        "query": query,
        "response": response_text,
        "sources": sources
    }
