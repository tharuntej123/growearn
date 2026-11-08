import os
import pytest
from app.main import health_check, generate_roadmap, verify_internal_secret
from app.schemas import RoadmapRequest
from fastapi import HTTPException

def test_health_endpoint():
    data = health_check()
    assert data["status"] == "ok"
    assert data["service"] == "growearn-agents"
    assert data["framework"] == "crewai"
    # Ensure sensitive credentials and provider details are NOT leaked
    assert "groq_api_key" not in data
    assert "tavily_api_key" not in data

def test_verify_internal_secret():
    # Test valid secret matching current key
    import app.main as main_mod
    original_key = main_mod.INTERNAL_SERVICE_KEY
    original_prev = main_mod.INTERNAL_SERVICE_KEY_PREVIOUS
    try:
        main_mod.INTERNAL_SERVICE_KEY = "test_super_secret_internal_key_32_chars_long"
        main_mod.INTERNAL_SERVICE_KEY_PREVIOUS = "previous_secret_internal_key_32_chars_long"

        # 1. Matches current key
        assert verify_internal_secret("test_super_secret_internal_key_32_chars_long") is True

        # 2. Matches rotated previous key
        assert verify_internal_secret("previous_secret_internal_key_32_chars_long") is True

        # 3. Missing header raises 401
        with pytest.raises(HTTPException) as exc:
            verify_internal_secret(None)
        assert exc.value.status_code == 401

        # 4. Invalid key raises 401
        with pytest.raises(HTTPException) as exc:
            verify_internal_secret("invalid_forged_key_value")
        assert exc.value.status_code == 401
    finally:
        main_mod.INTERNAL_SERVICE_KEY = original_key
        main_mod.INTERNAL_SERVICE_KEY_PREVIOUS = original_prev

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
