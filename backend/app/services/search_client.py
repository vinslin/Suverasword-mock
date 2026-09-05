from app.config import settings
from app.services.openai_client import get_client


def web_search(query: str, max_results: int = 4) -> dict:
    """Real live web search grounded via OpenAI's Responses API `web_search` tool
    (same model as chat, e.g. gpt-4o-mini) — no separate search vendor needed.
    """
    client = get_client()
    response = client.responses.create(
        model=settings.openai_model,
        input=query,
        tools=[{"type": "web_search"}],
    )

    sources = []
    seen_urls = set()
    for item in response.output:
        if item.type != "message":
            continue
        for content in item.content:
            for annotation in getattr(content, "annotations", None) or []:
                if annotation.type != "url_citation" or annotation.url in seen_urls:
                    continue
                seen_urls.add(annotation.url)
                sources.append({"name": annotation.title or annotation.url, "tag": annotation.url})
                if len(sources) >= max_results:
                    break

    return {"summary": response.output_text or "", "sources": sources}
