import pytest
from app.schemas import RoadmapRequest
from app.crew import build_agentic_roadmap
from app.tools import search_tavily, lookup_growearn_catalog

def test_tavily_tool_fallback_structure():
    results = search_tavily("Python Machine Learning")
    assert isinstance(results, list)
    assert len(results) > 0
    first = results[0]
    assert "title" in first
    assert "url" in first
    assert "snippet" in first

def test_catalog_lookup():
    catalog = lookup_growearn_catalog("Next.js")
    assert "courses" in catalog
    assert "mentors" in catalog
    assert len(catalog["courses"]) > 0
    assert len(catalog["mentors"]) > 0

def test_build_agentic_roadmap_direct():
    req = RoadmapRequest(
        role="DevOps & Cloud Engineer",
        current_skills=["Linux", "Git"],
        experience_level="INTERMEDIATE",
        target_timeline_weeks=16
    )
    res = build_agentic_roadmap(req)
    assert res.target_role == "DevOps & Cloud Engineer"
    assert len(res.phases) == 4
    assert len(res.agent_trace) == 3
    assert res.review_status == "APPROVED"

