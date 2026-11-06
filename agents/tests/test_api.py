import pytest
from app.main import health_check, generate_roadmap
from app.schemas import RoadmapRequest
from fastapi import HTTPException

def test_health_endpoint():
    data = health_check()
    assert data["status"] == "ok"
    assert data["service"] == "growearn-agents"
    assert "Researcher" in data["agents"]
    assert "Planner" in data["agents"]
    assert "Reviewer" in data["agents"]
    assert data["framework"] == "crewai"

def test_roadmap_endpoint_success():
    req = RoadmapRequest(
        role="Full Stack Engineer",
        current_skills=["HTML", "JavaScript"],
        experience_level="BEGINNER",
        target_timeline_weeks=16
    )
    data = generate_roadmap(req)

    assert data.target_role == "Full Stack Engineer"
    assert len(data.phases) == 4
    assert data.review_status in ["APPROVED", "REVISED"]
    assert data.mode == "agentic"

    # Verify all 3 agents are present in the trace
    agents_in_trace = [step.agent for step in data.agent_trace]
    assert "Researcher" in agents_in_trace
    assert "Planner" in agents_in_trace
    assert "Reviewer" in agents_in_trace

    # Verify Phase structure
    first_phase = data.phases[0]
    assert first_phase.phase_number == 1
    assert first_phase.duration_weeks == 4
    assert "Syntax" in " ".join(first_phase.skills)
    assert first_phase.capstone_project != ""

def test_roadmap_empty_role_raises_400():
    req = RoadmapRequest(role="")
    with pytest.raises(HTTPException) as exc_info:
        generate_roadmap(req)
    assert exc_info.value.status_code == 400
