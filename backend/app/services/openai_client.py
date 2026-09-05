from functools import lru_cache

from openai import OpenAI

from app.config import settings


@lru_cache
def get_client() -> OpenAI:
    return OpenAI(api_key=settings.openai_api_key)


def chat_completion(messages: list[dict], tools: list[dict] | None = None):
    client = get_client()
    kwargs = {"model": settings.openai_model, "messages": messages}
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"
    return client.chat.completions.create(**kwargs)
