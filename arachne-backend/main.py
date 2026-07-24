import uvicorn
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Tuple

app = FastAPI(
    title="Arachne Tactical Backend",
    description="Microservice for serving intelligence graphs and entities",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Node(BaseModel):
    id: str = Field(..., description="Unique node identifier")
    label: str = Field(..., description="Display label for the node")
    group: int = Field(..., description="Entity group: 1=Suspect, 2=Phone, 3=Vehicle, 4=FIR")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk score (0-100)")

class Edge(BaseModel):
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    relationship: str = Field(..., description="Relationship type: 'Called', 'Drives', 'Mentioned In'")

class GraphPayload(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class Incident(BaseModel):
    id: str = Field(..., description="Incident ID")
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")
    category: str = Field(..., description="Category: 'Armed Robbery', 'Cyber Fraud', 'Assault', 'Theft'")
    time_shift: str = Field(..., description="Shift: 'Day', 'Night'")

class PatrolZone(BaseModel):
    id: str = Field(..., description="Patrol Zone ID")
    coordinates: List[List[float]] = Field(..., description="Polygon coordinates [[lat, lng], ...]")
    risk_level: str = Field(..., description="Risk Level: 'High', 'Critical'")

# Utility mock generator
def generate_mock_graph() -> dict:
    # 17 Nodes (> 15)
    nodes = [
        # Suspects (Group 1)
        {"id": "S1", "label": "Vikram Malhotra (Main Suspect)", "group": 1, "risk_score": 95.5},
        {"id": "S2", "label": "Amit Shah (Associate)", "group": 1, "risk_score": 78.2},
        {"id": "S3", "label": "Rohan Joshi (Under Surveillance)", "group": 1, "risk_score": 62.0},
        {"id": "S4", "label": "Karan Singhal (Logistics)", "group": 1, "risk_score": 48.1},
        {"id": "S5", "label": "Sanjay Dutt (Informant/Suspect)", "group": 1, "risk_score": 55.4},
        
        # Phones (Group 2)
        {"id": "P1", "label": "+91 98765 43210 (Malhotra Burner)", "group": 2, "risk_score": 85.0},
        {"id": "P2", "label": "+91 87654 32109 (Malhotra Personal)", "group": 2, "risk_score": 45.0},
        {"id": "P3", "label": "+91 76543 21098 (Shah Burner)", "group": 2, "risk_score": 80.0},
        {"id": "P4", "label": "+91 65432 10987 (Joshi Burner)", "group": 2, "risk_score": 60.0},
        {"id": "P5", "label": "+91 54321 09876 (Dutt Burner)", "group": 2, "risk_score": 50.0},
        
        # Vehicles (Group 3)
        {"id": "V1", "label": "KA-51-MD-9876 (Black SUV)", "group": 3, "risk_score": 90.0},
        {"id": "V2", "label": "MH-12-AS-1284 (White Sedan)", "group": 3, "risk_score": 68.5},
        {"id": "V3", "label": "DL-03-KS-4242 (Delivery Van)", "group": 3, "risk_score": 35.0},
        
        # FIRs (Group 4)
        {"id": "F1", "label": "FIR-2026/89 (Smuggling)", "group": 4, "risk_score": 92.0},
        {"id": "F2", "label": "FIR-2026/102 (Conspiracy)", "group": 4, "risk_score": 75.0},
        {"id": "F3", "label": "FIR-2026/145 (Extortion)", "group": 4, "risk_score": 58.0},
        {"id": "F4", "label": "FIR-2026/188 (Cargo Theft)", "group": 4, "risk_score": 40.0},
    ]

    # 22 Edges (> 20)
    edges = [
        # Suspect 1 (Vikram Malhotra) Connections
        {"source": "S1", "target": "P1", "relationship": "Called"},
        {"source": "S1", "target": "P2", "relationship": "Called"},
        {"source": "S1", "target": "V1", "relationship": "Drives"},
        {"source": "S1", "target": "F1", "relationship": "Mentioned In"},
        {"source": "S1", "target": "F2", "relationship": "Mentioned In"},
        
        # Suspect 2 (Amit Shah) Connections
        {"source": "S2", "target": "P3", "relationship": "Called"},
        {"source": "S2", "target": "V2", "relationship": "Drives"},
        {"source": "S2", "target": "F1", "relationship": "Mentioned In"},
        
        # Inter-suspect and Cross-entity Calls
        {"source": "S2", "target": "P1", "relationship": "Called"},  # Amit Shah calls Malhotra's burner
        {"source": "S1", "target": "P3", "relationship": "Called"},  # Vikram Malhotra calls Amit Shah's burner
        {"source": "P2", "target": "P3", "relationship": "Called"},  # Malhotra personal calls Shah burner
        
        # Suspect 3 (Rohan Joshi) Connections
        {"source": "S3", "target": "P4", "relationship": "Called"},
        {"source": "S3", "target": "F3", "relationship": "Mentioned In"},
        {"source": "S3", "target": "P3", "relationship": "Called"},  # Rohan Joshi calls Amit Shah's burner
        
        # Suspect 4 (Karan Singhal) Connections
        {"source": "S4", "target": "V3", "relationship": "Drives"},
        {"source": "S4", "target": "F4", "relationship": "Mentioned In"},
        {"source": "S4", "target": "P4", "relationship": "Called"},  # Karan calls Rohan Joshi's burner
        
        # Suspect 5 (Sanjay Dutt) Connections
        {"source": "S5", "target": "P5", "relationship": "Called"},
        {"source": "S5", "target": "F2", "relationship": "Mentioned In"},
        {"source": "S5", "target": "P1", "relationship": "Called"},  # Sanjay calls Malhotra burner
        
        # Vehicle associations to Case files (FIRs)
        {"source": "V1", "target": "F1", "relationship": "Mentioned In"},
        {"source": "V2", "target": "F3", "relationship": "Mentioned In"},
    ]

    return {"nodes": nodes, "edges": edges}

def generate_geo_data() -> List[dict]:
    # Seed for reproducibility
    random.seed(42)
    categories = ['Armed Robbery', 'Cyber Fraud', 'Assault', 'Theft']
    shifts = ['Day', 'Night']
    center_lat, center_lng = 12.9716, 77.5946
    
    incidents = []
    for i in range(150):
        # Normal distribution clustering around Bangalore center (approx 1.5km std dev)
        lat = center_lat + random.normalvariate(0, 0.015)
        lng = center_lng + random.normalvariate(0, 0.015)
        category = random.choice(categories)
        shift = random.choice(shifts)
        
        incidents.append({
            "id": f"INC-{1000 + i}",
            "lat": lat,
            "lng": lng,
            "category": category,
            "time_shift": shift
        })
    return incidents

def calculate_predictive_zones(incidents: List[dict]) -> List[dict]:
    # Simulate an ML clustering output (density bounding polygons)
    return [
        {
            "id": "ZONE-ALPHA",
            "coordinates": [
                [12.982, 77.602],
                [12.995, 77.615],
                [12.985, 77.625],
                [12.972, 77.610],
                [12.982, 77.602]
            ],
            "risk_level": "Critical"
        },
        {
            "id": "ZONE-BRAVO",
            "coordinates": [
                [12.955, 77.582],
                [12.968, 77.595],
                [12.952, 77.608],
                [12.940, 77.590],
                [12.955, 77.582]
            ],
            "risk_level": "High"
        },
        {
            "id": "ZONE-CHARLIE",
            "coordinates": [
                [12.970, 77.570],
                [12.980, 77.582],
                [12.968, 77.590],
                [12.958, 77.575],
                [12.970, 77.570]
            ],
            "risk_level": "High"
        }
    ]

# Endpoint
@app.get("/api/v1/nexus/graph", response_model=GraphPayload)
def get_nexus_graph():
    return generate_mock_graph()

@app.get("/api/v1/geo/incidents", response_model=List[Incident])
def get_geo_incidents():
    return generate_geo_data()

@app.get("/api/v1/geo/predict-patrols", response_model=List[PatrolZone])
def get_predictive_patrols():
    incidents = generate_geo_data()
    return calculate_predictive_zones(incidents)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
