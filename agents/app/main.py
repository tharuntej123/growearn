import os
import sys
import hmac
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from repo root
_repo_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_repo_root / ".env.local")
load_dotenv(_repo_root / ".env")

from fastapi import FastAPI, HTTPException, Security, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from .schemas import RoadmapRequest, RoadmapResponse
from .crew import build_agentic_roadmap

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("growearn-agents")

# Internal service authentication configuration
INTERNAL_SERVICE_KEY = os.getenv("INTERNAL_SERVICE_KEY", "").strip()
INTERNAL_SERVICE_KEY_PREVIOUS = os.getenv("INTERNAL_SERVICE_KEY_PREVIOUS", "").strip()
ENVIRONMENT = os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development")).lower()

# Enforce strict 32+ character key requirement in production environments
if ENVIRONMENT == "production":
    if not INTERNAL_SERVICE_KEY or len(INTERNAL_SERVICE_KEY) < 32:
        logger.critical("FATAL: INTERNAL_SERVICE_KEY must be configured with >= 32 characters in production.")
        sys.exit(1)

api_key_header = APIKeyHeader(name="X-Internal-Secret", auto_error=False)

def verify_internal_secret(header_secret: str = Security(api_key_header)):
    """
    Verifies that the caller provides a valid internal service secret using constant-time comparison.
    Supports current and previous keys for seamless zero-downtime rotation.
    """
    # Require X-Internal-Secret unconditionally across all environments
    if not header_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-Internal-Secret authentication header."
        )

    expected_key = INTERNAL_SERVICE_KEY or ("development-internal-key-32-characters-minimum" if ENVIRONMENT != "production" else "")
    is_valid = False
    if expected_key:
        if hmac.compare_digest(header_secret.encode("utf-8"), expected_key.encode("utf-8")):
            is_valid = True

    if not is_valid and INTERNAL_SERVICE_KEY_PREVIOUS:
        if hmac.compare_digest(header_secret.encode("utf-8"), INTERNAL_SERVICE_KEY_PREVIOUS.encode("utf-8")):
            is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal service authentication credentials."
        )

    return True

app = FastAPI(
    title="Growearn CrewAI Multi-Agent Service",
    description="Multi-agent orchestration service (Researcher, Planner, Reviewer) for AI career roadmap generation.",
    version="1.0.0"
)

# Tighten CORS: Restrict to explicit application origins with credentials
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://app:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Internal-Secret"],
)

@app.get("/health")
def health_check():
    """
    Public health check endpoint returning service operational status.
    Returns no sensitive configuration or environment data.
    """
    return {
        "status": "ok",
        "service": "growearn-agents",
        "framework": "crewai"
    }

@app.post("/roadmap", response_model=RoadmapResponse, dependencies=[Depends(verify_internal_secret)])
def generate_roadmap(request: RoadmapRequest):
    """
    Generate an agent-grounded, peer-reviewed 4-phase career roadmap.
    Requires valid internal service secret header.
    """
    if not request.role or not request.role.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role parameter is required."
        )

    try:
        logger.info(f"Received roadmap generation request for role: '{request.role}' with {len(request.current_skills)} existing skills.")
        response = build_agentic_roadmap(request)
        return response
    except Exception as e:
        logger.error(f"Error during agentic roadmap generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate agentic roadmap."
        )

if __name__ == "__main__":
    import uvicorn
    # Bind to private localhost interface by default
    bind_host = os.getenv("AGENTS_HOST", "127.0.0.1")
    bind_port = int(os.getenv("AGENTS_PORT", "8000"))
    uvicorn.run(app, host=bind_host, port=bind_port)
