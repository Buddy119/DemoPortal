"""Handlers for chat modes."""

import os

import inspect
from langchain.callbacks.base import BaseCallbackHandler

from .mcp_client import mcp_client, Completion
from .agent_factory import create_agent
from langchain_openai import ChatOpenAI


class ExternalSearchError(Exception):
    """Raised when external retrieval fails in Agent Mode."""


async def handle_normal_mode(message: str) -> Completion:
    """Process a chat message in normal mode.

    For now this simply delegates to ``mcp_client.complete`` which
    utilises the built in MCP tools.
    """

    return await mcp_client.complete({}, message)


async def handle_agent_mode(
    message: str, stream_handler: BaseCallbackHandler | None = None
) -> Completion:
    """Process a chat message in agent mode using LangChain."""

    try:
        # Propagate env settings for OpenAI client if provided
        api_key = os.getenv("LLM_API_KEY")
        if api_key:
            os.environ.setdefault("OPENAI_API_KEY", api_key)
        base_url = os.getenv("LLM_BASE_URL")
        if base_url:
            os.environ.setdefault("OPENAI_BASE_URL", base_url.rstrip("/"))

        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        llm = ChatOpenAI(model=model, streaming=True)

        agent_obj = create_agent(
            llm, callbacks=[stream_handler] if stream_handler else None
        )
        agent = await agent_obj if inspect.isawaitable(agent_obj) else agent_obj

        invoke_config = {"callbacks": [stream_handler]} if stream_handler else None

        if hasattr(agent, "ainvoke"):
            result = await agent.ainvoke({"input": message}, config=invoke_config)
        else:
            maybe = agent.invoke({"input": message}, config=invoke_config)
            result = await maybe if inspect.isawaitable(maybe) else maybe

        return Completion(text=result.get("output", ""))
    except Exception as exc:  # noqa: BLE001
        raise ExternalSearchError(str(exc)) from exc
