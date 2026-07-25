import sys
import os

# Set python path to find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, Incident, Role
from app.utils import get_password_hash, verify_password

def run_test():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Checking if test user exists...")
        test_email = "test@arachne.gov"
        existing_user = db.query(User).filter(User.email == test_email).first()
        
        if existing_user:
            print(f"Test user already exists: {existing_user.name}")
        else:
            print("Creating new test user...")
            db_role = db.query(Role).filter(Role.name == "SHO").first()
            if not db_role:
                db_role = Role(name="SHO", description="Station House Officer Clearance")
                db.add(db_role)
                db.commit()
                db.refresh(db_role)

            hashed_pw = get_password_hash("securepass123")
            new_user = User(
                email=test_email,
                hashed_password=hashed_pw,
                name="Inspector Test Case",
                role_id=db_role.id
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"Test user created: {new_user.id}")
            
            # Verify password
            assert verify_password("securepass123", new_user.hashed_password) == True
            print("Password verification passed!")
            
        print("Checking if test incident exists...")
        test_inc = db.query(Incident).first()
        if test_inc:
            print(f"Incident exists: {test_inc.category} at ({test_inc.lat}, {test_inc.lng})")
        else:
            print("Creating new test incident...")
            from app.models import CrimeCategory, CrimeLocation, District, PoliceStation

            cat = db.query(CrimeCategory).filter(CrimeCategory.name == "Theft").first()
            if not cat:
                cat = CrimeCategory(name="Theft", description="Theft Category")
                db.add(cat)
                db.flush()

            dist = db.query(District).first()
            if not dist:
                dist = District(name="Central", description="Central District Command")
                db.add(dist)
                db.flush()

            station = db.query(PoliceStation).filter(PoliceStation.district_id == dist.id).first()
            if not station:
                station = PoliceStation(name="Central Precinct Station", district_id=dist.id, address="HQ Address")
                db.add(station)
                db.flush()

            location = CrimeLocation(lat=12.9716, lng=77.5946, address="Test center plaza", station_id=station.id)
            db.add(location)
            db.flush()

            new_inc = Incident(
                category_id=cat.id,
                location_id=location.id,
                time_shift="Night",
                description="Test incident logged at center plaza"
            )
            db.add(new_inc)
            db.commit()
            db.refresh(new_inc)
            print(f"Incident created: {new_inc.id}")
            
        print("\nAll database schema tests PASSED successfully!")
    except Exception as e:
        print(f"\nSchema test FAILED: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
