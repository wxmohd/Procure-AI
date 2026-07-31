import uuid
import json
import traceback
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage
from api.schemas import ChatRequest, ChatResponse
from agent.graph import agent_graph
from agent.streaming import stream_agent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

_sessions: dict[str, list] = {}


def _remember(session_id: str, query: str, answer: str) -> None:
    history = _sessions.get(session_id, [])
    _sessions[session_id] = (history + [
        HumanMessage(content=query),
        AIMessage(content=answer),
    ])[-20:]


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    messages = _sessions.get(session_id, [])

    def generate():
        answer_parts = []
        try:
            for event, data in stream_agent(messages, request.query):
                if event == "token":
                    answer_parts.append(data)
                yield _sse(event, data)
        except Exception:
            logger.error(f"Stream error for query: {request.query[:100]}")
            logger.error(traceback.format_exc())
            yield _sse("error", "Something went wrong. Please try again.")

        _remember(session_id, request.query, "".join(answer_parts))
        yield _sse("done", {"session_id": session_id})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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
    _remember(session_id, request.query, answer)

    return ChatResponse(
        answer=answer,
        pipeline=result.get("generated_pipeline"),
        results=result.get("query_results"),
        follow_ups=result.get("follow_ups"),
        session_id=session_id,
    )
