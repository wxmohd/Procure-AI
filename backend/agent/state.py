from typing import TypedDict, Optional, List
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_query: str
    generated_pipeline: Optional[List[dict]]
    query_results: Optional[List[dict]]
    final_answer: Optional[str]
    follow_ups: Optional[List[str]]
    error: Optional[str]