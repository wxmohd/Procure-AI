import uuid
import traceback
import logging
from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage, AIMessage
from api.schemas import ChatRequest, ChatResponse
from agent.graph import agent_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

_sessions: dict[str, list] = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    messages = _sessions.get(session_id, [])

    try:
        result = agent_graph.invoke({
            "messages": messages,
            "user_query": request.query,
            "generated_pipeline": None,
            "query_results": None,
            "final_answer": None,
            "follow_ups": None,
            "error": None,
        })
    except Exception as e:
        logger.error(f"Agent error for query: {request.query[:100]}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    answer = result.get("final_answer", "")
    _sessions[session_id] = (messages + [
        HumanMessage(content=request.query),
        AIMessage(content=answer),
    ])[-20:]

    return ChatResponse(
        answer=answer,
        pipeline=result.get("generated_pipeline"),
        results=result.get("query_results"),
        follow_ups=result.get("follow_ups"),
        session_id=session_id,
    )
