from typing import List, Optional
from pydantic import BaseModel, Field

class RoadmapRequest(BaseModel):
    role: str = Field(..., description="Target role or primary skill, e.g. 'Full Stack Engineer' or 'Machine Learning'")
    current_skills: List[str] = Field(default_factory=list, description="User's currently verified skills")
    experience_level: Optional[str] = Field("BEGINNER", description="Target experience level: BEGINNER, INTERMEDIATE, SENIOR")
    target_timeline_weeks: Optional[int] = Field(16, description="Target timeline in weeks")

class CourseRecommendation(BaseModel):
    title: str
    level: str
    match_score: int
    url: Optional[str] = None

class MentorRecommendation(BaseModel):
    name: str
    headline: str
    hourly_rate: float
    rating: float

class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    duration_weeks: int
    objective: str
    skills: List[str]
    practice_tasks: List[str]
    capstone_project: str
    milestone: str
    recommended_resources: List[str] = Field(default_factory=list)

class AgentTraceStep(BaseModel):
    agent: str = Field(..., description="Name of the agent: Researcher, Planner, or Reviewer")
    action: str = Field(..., description="Action taken by the agent")
    summary: str = Field(..., description="Key findings, decisions, or review notes")

class RoadmapResponse(BaseModel):
    target_role: str
    summary: str
    estimated_weeks: int
    phases: List[RoadmapPhase]
    recommended_courses: List[CourseRecommendation] = Field(default_factory=list)
    recommended_mentors: List[MentorRecommendation] = Field(default_factory=list)
    agent_trace: List[AgentTraceStep] = Field(default_factory=list)
    review_status: str = Field("APPROVED", description="APPROVED or REVISED")
    reviewer_notes: Optional[str] = None
    mode: str = Field("agentic", description="agentic or fallback")

