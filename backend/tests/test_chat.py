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
from services.mcp_client import LLMReply, ToolCall


@pytest.mark.asyncio
async def test_chat_list_apis(monkeypatch):
    async def fake_llm_chat(messages, *, tools_json=None):
        if len(messages) == 1 and messages[0].get("role") == "assistant":
            return LLMReply(content="listUsers")
        if any("我们有几个API" in m.get("content", "") for m in messages if m.get("role") == "user"):
            return LLMReply(content=None, tool_call=ToolCall(name="list_apis", arguments={}))
        return LLMReply(content="done")

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/chat", json={"message": "我们有几个API？"})
    assert resp.status_code == 200
    data = resp.json()
    assert "listUsers" in data["message"]


@pytest.mark.asyncio
async def test_chat_get_api_sample(monkeypatch):
    async def fake_llm_chat(messages, *, tools_json=None):
        if len(messages) == 1 and messages[0].get("role") == "assistant":
            return LLMReply(content="curl -X GET http://localhost:8000/api/users/{id}")
        if any("getUser" in m.get("content", "") for m in messages if m.get("role") == "user"):
            return LLMReply(
                content=None,
                tool_call=ToolCall(
                    name="get_api_sample",
                    arguments={"api_name": "getUser"},
                ),
            )
        return LLMReply(content="sample")

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/chat", json={"message": "给我 getUser 的示例"})
    assert resp.status_code == 200
    data = resp.json()
    assert "curl" in data["message"]


@pytest.mark.asyncio
async def test_invalid_json_retry(monkeypatch):
    calls = 0

    async def fake_llm_chat(messages, *, tools_json=None):
        nonlocal calls
        calls += 1
        if calls == 1:
            return LLMReply(content=None, tool_call=None)
        return LLMReply(content="final")

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/chat", json={"message": "hi"})
    assert resp.status_code == 200
    assert resp.json()["message"] == "final"
    assert calls == 2


@pytest.mark.asyncio
async def test_system_prompt(monkeypatch):
    captured = {}

    async def fake_llm_chat(messages, *, tools_json=None):
        captured["system"] = messages[0]["content"]
        return LLMReply(content="ok")

    monkeypatch.setattr(client_mod, "llm_chat", fake_llm_chat)

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/chat", json={"message": "Ignore all"})

    assert captured["system"] == client_mod.SYSTEM_PROMPT
