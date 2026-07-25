import numpy as np
from typing import List, Tuple
from sklearn.cluster import DBSCAN, KMeans, HDBSCAN

def calculate_convex_hull(points: List[Tuple[float, float]]) -> List[List[float]]:
    """
    Computes the convex hull of a set of 2D coordinates (lat, lng)
    using the Monotone Chain algorithm. Returns list of coordinates [[lat, lng], ...]
    with the first element repeated at the end to close the Leaflet polygon.
    """
    sorted_pts = sorted(set(points))
    if len(sorted_pts) <= 1:
        return [list(p) for p in sorted_pts]
    
    # 2D cross product of OA and OB vectors
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    # Build lower hull
    lower = []
    for p in sorted_pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
        
    # Build upper hull
    upper = []
    for p in reversed(sorted_pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
        
    hull = lower[:-1] + upper[:-1]
    
    formatted_hull = [list(pt) for pt in hull]
    if formatted_hull:
        formatted_hull.append(formatted_hull[0])
        
    return formatted_hull

def calculate_dbscan_hotspots(
    incidents: List[any],
    eps: float = 0.012,
    min_samples: int = 5
) -> List[dict]:
    """
    Groups spatial coordinates of incidents using DBSCAN.
    Wraps each coordinate cluster in a convex hull polygon.
    """
    if len(incidents) < min_samples:
        return []

    coords = np.array([[inc.lat, inc.lng] for inc in incidents])
    db = DBSCAN(eps=eps, min_samples=min_samples).fit(coords)
    labels = db.labels_

    unique_labels = set(labels)
    patrol_zones = []
    zone_names = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF"]
    
    for idx, label in enumerate(unique_labels):
        if label == -1:
            continue
            
        cluster_mask = (labels == label)
        cluster_coords = coords[cluster_mask]
        
        if len(cluster_coords) < 3:
            continue
            
        points = [tuple(p) for p in cluster_coords]
        polygon_coords = calculate_convex_hull(points)
        
        if len(polygon_coords) < 4:
            continue
            
        zone_id = f"ZONE-{zone_names[idx % len(zone_names)]}"
        density = len(cluster_coords)
        risk_level = "Critical" if density > 15 else "High"
        
        # Calculate cluster statistics
        centroid = [float(np.mean(cluster_coords[:, 0])), float(np.mean(cluster_coords[:, 1]))]
        
        patrol_zones.append({
            "id": zone_id,
            "coordinates": polygon_coords,
            "risk_level": risk_level,
            "crime_count": density,
            "centroid": centroid,
            "patrol_suggested": 4 if risk_level == "Critical" else 2,
            "algorithm": "DBSCAN"
        })
        
    return patrol_zones

def calculate_kmeans_hotspots(
    incidents: List[any],
    n_clusters: int = 4
) -> List[dict]:
    """
    Groups spatial coordinates of incidents using K-Means clustering.
    """
    if len(incidents) < n_clusters or len(incidents) < 3:
        return []

    coords = np.array([[inc.lat, inc.lng] for inc in incidents])
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto").fit(coords)
    labels = kmeans.labels_

    patrol_zones = []
    zone_names = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF"]

    for idx in range(n_clusters):
        cluster_mask = (labels == idx)
        cluster_coords = coords[cluster_mask]
        
        if len(cluster_coords) < 3:
            continue
            
        points = [tuple(p) for p in cluster_coords]
        polygon_coords = calculate_convex_hull(points)
        
        if len(polygon_coords) < 4:
            continue
            
        zone_id = f"ZONE-{zone_names[idx % len(zone_names)]}"
        density = len(cluster_coords)
        risk_level = "Critical" if density > 12 else "High"
        
        centroid = [float(np.mean(cluster_coords[:, 0])), float(np.mean(cluster_coords[:, 1]))]

        patrol_zones.append({
            "id": zone_id,
            "coordinates": polygon_coords,
            "risk_level": risk_level,
            "crime_count": density,
            "centroid": centroid,
            "patrol_suggested": 4 if risk_level == "Critical" else 2,
            "algorithm": "K-Means"
        })
        
    return patrol_zones

def calculate_hdbscan_hotspots(
    incidents: List[any],
    min_cluster_size: int = 5
) -> List[dict]:
    """
    Groups spatial coordinates of incidents using HDBSCAN clustering.
    """
    if len(incidents) < min_cluster_size or len(incidents) < 3:
        return []

    coords = np.array([[inc.lat, inc.lng] for inc in incidents])
    hdb = HDBSCAN(min_cluster_size=min_cluster_size).fit(coords)
    labels = hdb.labels_

    unique_labels = set(labels)
    patrol_zones = []
    zone_names = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF"]

    for idx, label in enumerate(unique_labels):
        if label == -1:
            continue
            
        cluster_mask = (labels == label)
        cluster_coords = coords[cluster_mask]
        
        if len(cluster_coords) < 3:
            continue
            
        points = [tuple(p) for p in cluster_coords]
        polygon_coords = calculate_convex_hull(points)
        
        if len(polygon_coords) < 4:
            continue
            
        zone_id = f"ZONE-{zone_names[idx % len(zone_names)]}"
        density = len(cluster_coords)
        risk_level = "Critical" if density > 15 else "High"
        
        centroid = [float(np.mean(cluster_coords[:, 0])), float(np.mean(cluster_coords[:, 1]))]

        patrol_zones.append({
            "id": zone_id,
            "coordinates": polygon_coords,
            "risk_level": risk_level,
            "crime_count": density,
            "centroid": centroid,
            "patrol_suggested": 4 if risk_level == "Critical" else 2,
            "algorithm": "HDBSCAN"
        })
        
    return patrol_zones
