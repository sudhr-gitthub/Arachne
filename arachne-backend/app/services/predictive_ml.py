import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from app.models import CrimeRecord, CrimeCategory, CrimeLocation, PoliceStation, District

MODEL_PATH = os.path.join(os.path.dirname(__file__), "rf_model.pkl")

def train_crime_model(db: Session) -> dict:
    """
    Pulls all crime records from the database, pre-processes the features,
    trains a RandomForestClassifier, evaluates performance metrics, and saves the model.
    """
    records = db.query(CrimeRecord).all()
    if len(records) < 10:
        return {"status": "error", "message": "Not enough crime records to train the model. Require at least 10 records."}
        
    data = []
    for r in records:
        # Resolve district
        district_name = "Central"
        if r.location_rel and r.location_rel.station and r.location_rel.station.district:
            district_name = r.location_rel.station.district.name
            
        data.append({
            "district": district_name,
            "category": r.category_rel.name if r.category_rel else "Theft",
            "time_shift": r.time_shift,
            "day_of_week": r.date.weekday(), # 0-6
            "month": r.date.month, # 1-12
        })
        
    df = pd.DataFrame(data)
    
    # Label encode categorical columns
    le_district = LabelEncoder()
    le_category = LabelEncoder()
    le_shift = LabelEncoder()
    
    df["district_enc"] = le_district.fit_transform(df["district"])
    df["category_enc"] = le_category.fit_transform(df["category"])
    df["shift_enc"] = le_shift.fit_transform(df["time_shift"])
    
    # Feature engineering: target labeling (Risk Levels)
    # Mapping Robbery -> Critical, Assault -> High, Theft -> Medium, Cyber -> Low
    def get_risk_label(category):
        if category == "Armed Robbery":
            return 3 # Critical
        elif category == "Assault":
            return 2 # High
        elif category == "Theft":
            return 1 # Medium
        return 0 # Low
        
    df["target"] = df["category"].apply(get_risk_label)
    
    X = df[["district_enc", "category_enc", "shift_enc", "day_of_week", "month"]]
    y = df["target"]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = rf.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    conf_matrix = confusion_matrix(y_test, y_pred).tolist()
    
    # Save the model and encoders
    model_payload = {
        "model": rf,
        "le_district": le_district,
        "le_category": le_category,
        "le_shift": le_shift,
        "classes": ["Low", "Medium", "High", "Critical"]
    }
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_payload, f)
        
    return {
        "status": "success",
        "metrics": {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1": float(f1),
            "confusion_matrix": conf_matrix
        }
    }

def get_risk_prediction(
    db: Session,
    district_name: str,
    category_name: str,
    shift: str,
    day_of_week: int,
    month: int
) -> dict:
    """
    Loads the trained model, performs prediction, suggests patrol strength, and explains the risk output.
    """
    # If model is not trained yet, train it dynamically
    if not os.path.exists(MODEL_PATH):
        train_res = train_crime_model(db)
        if train_res["status"] == "error":
            # Return a default fallback structure if training failed due to lack of records
            return {
                "risk_level": "Medium",
                "probability": 0.55,
                "patrol_strength": 2,
                "risk_score": 55,
                "explanation": "Calculated based on default baseline averages due to lack of trained ML weights."
            }
            
    with open(MODEL_PATH, "rb") as f:
        payload = pickle.load(f)
        
    model = payload["model"]
    le_district = payload["le_district"]
    le_category = payload["le_category"]
    le_shift = payload["le_shift"]
    classes = payload["classes"]
    
    # Handle unseen label categories safely
    try:
        dist_val = le_district.transform([district_name])[0]
    except:
        dist_val = 0
    try:
        cat_val = le_category.transform([category_name])[0]
    except:
        cat_val = 0
    try:
        shift_val = le_shift.transform([shift])[0]
    except:
        shift_val = 0
        
    features = np.array([[dist_val, cat_val, shift_val, day_of_week, month]])
    
    pred_idx = model.predict(features)[0]
    probs = model.predict_proba(features)[0]
    prob_score = float(probs[pred_idx])
    
    risk_level = classes[pred_idx]
    
    # Suggested patrol strength mapping
    patrol_mapping = {
        "Low": 1,
        "Medium": 2,
        "High": 4,
        "Critical": 6
    }
    patrol_strength = patrol_mapping.get(risk_level, 2)
    risk_score = int(prob_score * 100)
    
    # Predictions Explanation details builder
    explanation = f"Predictive model flags {risk_level.upper()} threat risk ({risk_score}% probability score) for incident class {category_name} in {district_name} Sector during {shift} shift. "
    if risk_level in ["High", "Critical"]:
        explanation += "Recommendation: Dispatch tactical intercept patrol response units immediately."
    else:
        explanation += "Recommendation: Continue routine monitoring sweeps."
        
    return {
        "risk_level": risk_level,
        "probability": prob_score,
        "patrol_strength": patrol_strength,
        "risk_score": risk_score,
        "explanation": explanation
    }
