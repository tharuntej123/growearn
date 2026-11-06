import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from repo root
_repo_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_repo_root / ".env.local")
load_dotenv(_repo_root / ".env")

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .schemas import RoadmapRequest, RoadmapResponse
from .crew import build_agentic_roadmap

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("growearn-agents")

app = FastAPI(
    title="Growearn CrewAI Multi-Agent Service",
    description="Multi-agent orchestration service (Researcher, Planner, Reviewer) for AI career roadmap generation.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """
    Health check endpoint returning service readiness and configuration status.
    """
    has_groq = bool(os.getenv("GROQ_API_KEY", "").strip())
    has_tavily = bool(os.getenv("TAVILY_API_KEY", "").strip())
    return {
        "status": "ok",
        "service": "growearn-agents",
        "agents": ["Researcher", "Planner", "Reviewer"],
        "llm_provider": "groq",
        "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "tavily_enabled": has_tavily,
        "groq_configured": has_groq,
        "framework": "crewai"
    }

@app.post("/roadmap", response_model=RoadmapResponse)
def generate_roadmap(request: RoadmapRequest):
    """
    Generate an agent-grounded, peer-reviewed 4-phase career roadmap.
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
    uvicorn.run(app, host="0.0.0.0", port=8000)

