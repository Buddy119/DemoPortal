"""Handlers for chat modes."""

from .mcp_client import mcp_client, Completion


class ExternalSearchError(Exception):
    """Raised when external retrieval fails in Agent Mode."""


async def handle_normal_mode(message: str) -> Completion:
    """Process a chat message in normal mode.

    For now this simply delegates to ``mcp_client.complete`` which
    utilises the built in MCP tools.
    """

    return await mcp_client.complete({}, message)


async def handle_agent_mode(message: str) -> Completion:
    """Process a chat message in agent mode.

    The agent functionality is not implemented yet so we currently
    fall back to the same behaviour as normal mode.  This function is
    kept separate so that more advanced logic can be plugged in later
    without touching the router or WebSocket code.
    """

    try:
        return await mcp_client.complete({}, message, include_search=True)
    except Exception as exc:  # noqa: BLE001
        raise ExternalSearchError(str(exc)) from exc

