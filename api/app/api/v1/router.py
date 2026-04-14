from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    conversation_sessions,
    countries,
    feedback,
    health,
    messages,
    scenarios,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(countries.router, tags=["countries"])
api_router.include_router(scenarios.router, tags=["scenarios"])
api_router.include_router(conversation_sessions.router, tags=["conversation-sessions"])
api_router.include_router(messages.router, tags=["messages"])
api_router.include_router(feedback.router, tags=["feedback"])
