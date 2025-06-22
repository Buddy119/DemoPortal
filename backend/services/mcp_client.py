import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List

import fastmcp
from fastmcp import Client, FastMCP

# --- MCP server setup with built-in tools ---------------------------------

APIS = [
    {
        "name": "listUsers",
        "path": "/api/users",
        "method": "GET",
        "description": "List all users",
    },
    {
        "name": "getUser",
        "path": "/api/users/{id}",
        "method": "GET",
        "description": "Get a specific user",
    },
]

mcp_server = FastMCP(name="DevPortalServer")


@mcp_server.tool(name="list_apis")
def list_apis() -> List[Dict[str, str]]:
    """Return a list of available HTTP APIs."""
    return APIS


@mcp_server.tool(name="get_api_sample")
def get_api_sample(api_name: str) -> str:
    """Return a curl example for the given API name."""
    for api in APIS:
        if api_name.lower() == api["name"].lower():
            return f"curl -X {api['method']} http://localhost:8000{api['path']}"
    raise ValueError(f"API '{api_name}' not found")


# --- LLM chat helper ------------------------------------------------------

async def llm_chat(messages: List[Dict[str, Any]], *, tools: List[Dict[str, Any]] | None = None) -> Dict[str, Any]:
    """Send chat messages to an OpenAI-compatible endpoint."""
    import httpx

    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.getenv("LLM_API_KEY", "")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    payload: Dict[str, Any] = {"model": model, "messages": messages}
    if tools:
        payload["tools"] = tools
    headers = {"Authorization": f"Bearer {api_key}"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()


# --- MCP client wrapper ---------------------------------------------------

@dataclass
class Completion:
    text: str
    highlight_selector: str | None = None


class MCPClient:
    def __init__(self) -> None:
        self._client = Client(mcp_server)

    async def complete(self, context: Dict[str, Any], user_query: str) -> Completion:
        messages = [
            {"role": "system", "content": "You are an API assistant."},
            {"role": "user", "content": user_query},
        ]
        async with self._client as session:
            tools = [t.model_dump() for t in await session.list_tools()]
            first = await llm_chat(messages, tools=tools)
            message = first["choices"][0]["message"]
            if "tool_calls" in message:
                call = message["tool_calls"][0]
                args = json.loads(call["function"].get("arguments", "{}"))
                result_content = await session.call_tool(call["function"]["name"], args)
                tool_text = "\n".join(
                    c.text for c in result_content if getattr(c, "text", None) is not None
                )
                messages.append({"role": "assistant", "tool_calls": [call]})
                messages.append({"role": "tool", "tool_call_id": call["id"], "content": tool_text})
                final = await llm_chat(messages)
                text = final["choices"][0]["message"].get("content", "")
            else:
                text = message.get("content", "")
        return Completion(text=text)


mcp_client = MCPClient()
