import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import fastmcp
from fastmcp import Client, FastMCP

# --- MCP server setup with built-in tools ---------------------------------

APIS = [
    {
        "id": "list-users",
        "name": "listUsers",
        "description": "List all users",
        "endpoint": "/api/users",
        "method": "GET",
        "parameters": [],
        "curlExample": "curl -X GET '<baseURL>/api/users'",
        "responseExample": '{"data": [{"id": 1, "name": "Alice"}]}',
        "fields": [],
    },
    {
        "id": "get-user",
        "name": "getUser",
        "description": "Get a specific user",
        "endpoint": "/api/users/{id}",
        "method": "GET",
        "parameters": [
            {"name": "id", "type": "string", "description": "User identifier"}
        ],
        "curlExample": "curl -X GET '<baseURL>/api/users/{id}'",
        "responseExample": '{"data": {"id": 1, "name": "Alice"}}',
        "fields": [],
    },
]

SYSTEM_PROMPT = (
    "You are DevPortal-Bot. Use the provided tools to answer API-related questions.\n"
    "\n"
    "When you need metadata (list, path, method, examples), call that tool instead of guessing.\n"
    "\n"
    "If the question is not API-specific, answer directly."
)

mcp_server = FastMCP(name="DevPortalServer")


@mcp_server.tool(name="list_apis")
def list_apis() -> List[Dict[str, str]]:
    """List all available HTTP APIs with name, method, endpoint, and description."""
    return [
        {
            "name": api["name"],
            "method": api["method"],
            "endpoint": api["endpoint"],
            "description": api["description"],
        }
        for api in APIS
    ]


@mcp_server.tool(name="get_api_details")
def get_api_details(api_name: str) -> Dict[str, Any]:
    """Provide detailed information (method, endpoint, parameters, response example) about a specific API."""
    for api in APIS:
        if api["name"].lower() == api_name.lower():
            return api
    raise ValueError(f"API '{api_name}' not found")


@mcp_server.tool(name="get_api_sample")
def get_api_sample(api_name: str) -> str:
    """Return a ready-to-run curl command for the specified API."""
    for api in APIS:
        if api_name.lower() == api["name"].lower():
            return api["curlExample"]
    raise ValueError(f"API '{api_name}' not found")


@mcp_server.tool(name="search_apis")
def search_apis(keyword: str) -> List[Dict[str, str]]:
    """Search and return APIs matching a keyword."""
    keyword_lower = keyword.lower()
    return [
        {
            "name": api["name"],
            "method": api["method"],
            "endpoint": api["endpoint"],
            "description": api["description"],
        }
        for api in APIS
        if keyword_lower in api["name"].lower() or keyword_lower in api["description"].lower()
    ]


@mcp_server.tool(name="get_api_parameters")
def get_api_parameters(api_name: str) -> List[Dict[str, str]]:
    """Return parameters for the specified API."""
    for api in APIS:
        if api_name.lower() == api["name"].lower():
            return api.get("parameters", [])
    raise ValueError(f"API '{api_name}' not found")


@mcp_server.tool(name="get_api_response_example")
def get_api_response_example(api_name: str) -> str:
    """Provide an example JSON response for the specified API."""
    for api in APIS:
        if api_name.lower() == api["name"].lower():
            return api["responseExample"]
    raise ValueError(f"API '{api_name}' not found")


# --- LLM chat helper ------------------------------------------------------

@dataclass
class ToolCall:
    name: str
    arguments: Dict[str, Any]


@dataclass
class LLMReply:
    content: Optional[str]
    tool_call: Optional[ToolCall] = None


async def get_cached_tools(session: Client) -> List[Dict[str, Any]]:
    if getattr(session, "_cached_tools", None) is None:
        tool_infos = await session.list_tools()
        session._cached_tools = [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description or "",
                    "parameters": t.inputSchema,
                },
            }
            for t in tool_infos
        ]
    return session._cached_tools


async def llm_chat(messages: List[Dict[str, Any]], tools_json: List[Dict[str, Any]] | None) -> LLMReply:
    """Send chat messages to an OpenAI-compatible endpoint."""
    import httpx

    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.getenv("LLM_API_KEY", "")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    payload: Dict[str, Any] = {"model": model, "messages": messages}
    if tools_json:
        payload["tools"] = tools_json
    headers = {"Authorization": f"Bearer {api_key}"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

    print(f"LLM payload -> {payload}")
    message = data["choices"][0]["message"]
    if "tool_calls" in message:
        call = message["tool_calls"][0]
        try:
            args = json.loads(call["function"].get("arguments", "{}"))
        except json.JSONDecodeError:
            return LLMReply(content=None, tool_call=None)
        return LLMReply(content=message.get("content"), tool_call=ToolCall(call["function"]["name"], args))
    return LLMReply(content=message.get("content"), tool_call=None)


# --- MCP client wrapper ---------------------------------------------------

@dataclass
class Completion:
    text: str
    highlight_selector: str | None = None


class MCPClient:
    def __init__(self) -> None:
        self._client = Client(mcp_server)

    async def call_tool(self, session: Client, name: str, arguments: Dict[str, Any]) -> str:
        try:
            result = await session.call_tool(name=name, arguments=arguments)
            return "\n".join(
                c.text for c in result if getattr(c, "text", None) is not None
            )
        except Exception as exc:
            return f"Error calling tool '{name}': {exc}"

    async def complete(self, context: Dict[str, Any], user_query: str) -> Completion:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_query},
        ]
        async with self._client as session:
            tools_json = await get_cached_tools(session)
            first = await llm_chat(messages, tools_json=tools_json)
            if first.tool_call is None and first.content is None:
                first = await llm_chat(messages, tools_json=tools_json)
            if first.tool_call:
                tool_output = await self.call_tool(session, first.tool_call.name, first.tool_call.arguments)
                second = await llm_chat([{"role": "assistant", "content": tool_output}], tools_json=None)
                text = second.content or ""
            else:
                text = first.content or ""
        return Completion(text=text)


mcp_client = MCPClient()
