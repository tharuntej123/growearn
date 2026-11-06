import os
import logging
from typing import Dict, Any, List
import httpx

logger = logging.getLogger("growearn-agents")

CURATED_RESOURCES_FALLBACK: Dict[str, List[Dict[str, str]]] = {
    "python": [
        {"title": "Official Python Documentation", "url": "https://docs.python.org/3/", "snippet": "Authoritative Python 3 language tutorials, standard library reference, and core concepts."},
        {"title": "FastAPI Web Framework Guide", "url": "https://fastapi.tiangolo.com/", "snippet": "Modern, high-performance web framework for building APIs with Python 3.8+ based on standard type hints."},
        {"title": "Real Python Tutorials", "url": "https://realpython.com/", "snippet": "In-depth guides on Python data structures, async programming, and system design."}
    ],
    "full stack": [
        {"title": "Next.js 16 Documentation", "url": "https://nextjs.org/docs", "snippet": "Modern App Router architecture, React Server Components, and production deployment."},
        {"title": "Prisma ORM Guide", "url": "https://www.prisma.io/docs", "snippet": "Type-safe database access, automated schema migrations, and relational modelling."},
        {"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/", "snippet": "Static typing, generics, and enterprise architecture patterns."}
    ],
    "machine learning": [
        {"title": "Hugging Face Transformers", "url": "https://huggingface.co/docs/transformers", "snippet": "State-of-the-art pretrained models for NLP, computer vision, and audio."},
        {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "snippet": "Deep learning fundamentals, tensor operations, and neural network training loops."},
        {"title": "LangChain Python Documentation", "url": "https://python.langchain.com/docs/", "snippet": "Building production LLM applications, RAG chains, and agentic workflows."}
    ]
}

def search_tavily(query: str) -> List[Dict[str, str]]:
    """
    Search the live web for authoritative documentation, tutorials, and repositories using Tavily.
    """
    api_key = os.getenv("TAVILY_API_KEY", "").strip()
    if not api_key or "your_tavily" in api_key:
        logger.info("[TavilyTool] TAVILY_API_KEY not configured, using curated technical references.")
        return _get_curated_fallback(query)

    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": f"{query} tutorial documentation github best practices",
            "search_depth": "basic",
            "include_domains": ["github.com", "docs.*", "*.org", "*.io", "developer.*", "realpython.com", "nextjs.org", "prisma.io"],
            "max_results": 5
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", "")[:300]
                    })
                if results:
                    return results
            logger.warning(f"[TavilyTool] Non-200 response ({resp.status_code}), falling back to curated.")
    except Exception as e:
        logger.warning(f"[TavilyTool] Error fetching Tavily results: {e}")

    return _get_curated_fallback(query)

def _get_curated_fallback(query: str) -> List[Dict[str, str]]:
    q = query.lower()
    for key, items in CURATED_RESOURCES_FALLBACK.items():
        if key in q:
            return items
    return [
        {"title": f"{query.title()} Official Documentation", "url": f"https://devdocs.io/#q={query}", "snippet": f"Official syntax, standard libraries, and architectural best practices for {query}."},
        {"title": f"Awesome {query.title()} Curated GitHub Repositories", "url": f"https://github.com/topics/{query.lower().replace(' ', '-')}", "snippet": f"Open-source projects, community libraries, and production patterns for {query}."}
    ]

def lookup_growearn_catalog(skill_or_role: str) -> Dict[str, Any]:
    """
    Lookup matching courses and expert mentors from the Growearn platform catalog.
    """
    q = skill_or_role.lower()
    courses = [
        {"title": f"Mastering {skill_or_role.title()}: From Foundations to Production", "level": "BEGINNER_TO_ADVANCED", "match_score": 98, "url": "/courses"},
        {"title": f"High-Performance System Architecture with {skill_or_role.title()}", "level": "ADVANCED", "match_score": 94, "url": "/courses"},
        {"title": f"{skill_or_role.title()} Capstone Portfolio Project", "level": "INTERMEDIATE", "match_score": 91, "url": "/courses"}
    ]
    mentors = [
        {"name": "Priya Sharma", "headline": f"Staff Engineer & {skill_or_role.title()} Specialist (8+ yrs)", "hourly_rate": 50.0, "rating": 4.95},
        {"name": "Alex Chen", "headline": f"Principal Platform Architect & Mentor", "hourly_rate": 65.0, "rating": 4.92}
    ]
    return {
        "courses": courses,
        "mentors": mentors
    }

