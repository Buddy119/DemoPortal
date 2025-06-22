import asyncio
import json
import os
import sys

import pytest
from httpx import AsyncClient
import httpx

# Add backend path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import main
from services import mcp_client as client_mod


@pytest.mark.asyncio
async def test_chat_list_apis(monkeypatch):
    async def fake_llm_chat(messages, *, tools=None):
        if any(m.get("role") == "tool" for m in messages):
            return {"choices": [{"message": {"role": "assistant", "content": "listUsers"}}]}
        if any("我们有几个API" in m.get("content", "") for m in messages if m.get("role") == "user"):
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "1",
                                    "type": "function",
                                    "function": {"name": "list_apis", "arguments": "{}"},
                                }
                            ],
                        }
                    }
                ]
            }
        return {"choices": [{"message": {"role": "assistant", "content": "done"}}]}

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/chat", json={"message": "我们有几个API？"})
    assert resp.status_code == 200
    data = resp.json()
    assert "listUsers" in data["message"]


@pytest.mark.asyncio
async def test_chat_get_api_sample(monkeypatch):
    async def fake_llm_chat(messages, *, tools=None):
        if any(m.get("role") == "tool" for m in messages):
            return {"choices": [{"message": {"role": "assistant", "content": "curl -X GET http://localhost:8000/api/users/{id}"}}]}
        if any("getUser" in m.get("content", "") for m in messages if m.get("role") == "user"):
            return {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": [
                                {
                                    "id": "1",
                                    "type": "function",
                                    "function": {
                                        "name": "get_api_sample",
                                        "arguments": json.dumps({"api_name": "getUser"}),
                                    },
                                }
                            ],
                        }
                    }
                ]
            }
        return {"choices": [{"message": {"role": "assistant", "content": "sample"}}]}

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/chat", json={"message": "给我 getUser 的示例"})
    assert resp.status_code == 200
    data = resp.json()
    assert "curl" in data["message"]
