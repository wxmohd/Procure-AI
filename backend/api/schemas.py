from pydantic import BaseModel
from typing import Optional, List, Any


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    pipeline: Optional[List[Any]] = None
    results: Optional[List[Any]] = None
    follow_ups: Optional[List[str]] = None
    session_id: str
