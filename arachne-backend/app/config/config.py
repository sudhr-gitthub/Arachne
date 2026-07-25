import os
from pydantic import BaseModel

# Manually load .env file if it exists
def load_env():
    for path in [".env", "../.env", "app/config/.env"]:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'").strip('"')
                        if k:
                            os.environ[k] = v
            break

load_env()


class Settings(BaseModel):
    PROJECT_NAME: str = "Arachne Tactical Backend"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./arachne.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7d264e1d93bdf5c829e1c258d4a974ea487a55be62db94d1f2a36b56b9c97210")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Generative AI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
