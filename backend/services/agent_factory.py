from typing import Optional, Sequence

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.callbacks.base import BaseCallbackHandler

from .mcp_client import structured_mcp_tools


def create_agent(llm: Optional[ChatOpenAI] = None, callbacks: Optional[Sequence[BaseCallbackHandler]] = None) -> AgentExecutor:
    """Create a LangChain AgentExecutor using existing MCP tools."""
    if llm is None:
        llm = ChatOpenAI(streaming=True)
    agent = create_openai_functions_agent(llm, structured_mcp_tools)
    return AgentExecutor(
        agent=agent,
        tools=structured_mcp_tools,
        callbacks=list(callbacks) if callbacks else None,
        max_iterations=6,
        verbose=True,
    )
