"""Handlers for chat modes."""

from langchain.callbacks.base import BaseCallbackHandler
import inspect

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


async def handle_agent_mode(message: str, stream_handler: BaseCallbackHandler | None = None) -> Completion:
    """Process a chat message in agent mode using LangChain."""

    try:
        llm = ChatOpenAI(streaming=True)
        agent_obj = create_agent(
            llm, callbacks=[stream_handler] if stream_handler else None
        )
        agent = await agent_obj if inspect.isawaitable(agent_obj) else agent_obj
        result = await agent.invoke({"input": message})
        return Completion(text=result.get("output", ""))
    except Exception as exc:  # noqa: BLE001
        raise ExternalSearchError(str(exc)) from exc

