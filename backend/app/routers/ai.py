from fastapi import APIRouter
from pydantic import BaseModel

from app.services.openai_client import chat_completion
from app.services.search_client import web_search as do_web_search

import json

router = APIRouter(prefix="/ai", tags=["ai"])

WEB_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "web_search",
        "description": "Search the web for up-to-date information.",
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
}


class AiQueryIn(BaseModel):
    text: str


class AiQueryOut(BaseModel):
    text: str
    sources: list[dict] = []


@router.post("/query", response_model=AiQueryOut)
def ai_query(payload: AiQueryIn):
    """One-shot AI query — does NOT save to any chat history."""
    messages = [{"role": "user", "content": payload.text}]

    for _ in range(4):
        response = chat_completion(messages, tools=[WEB_SEARCH_TOOL])
        choice = response.choices[0].message
        messages.append(choice.model_dump(exclude_none=True))

        if not choice.tool_calls:
            sources = []
            return AiQueryOut(text=choice.content or "", sources=sources)

        for tool_call in choice.tool_calls:
            if tool_call.function.name == "web_search":
                try:
                    args = json.loads(tool_call.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}
                result = do_web_search(args.get("query", ""))
                sources = result.get("sources", [])
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

    return AiQueryOut(text="Could not generate a response.", sources=[])
