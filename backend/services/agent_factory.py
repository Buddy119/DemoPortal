import os
from typing import Optional, Sequence

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent, OpenAIFunctionsAgent
from langchain.callbacks.base import BaseCallbackHandler

from .mcp_client import _generate_structured_tools


async def create_agent(
    llm: Optional[ChatOpenAI] = None,
    callbacks: Optional[Sequence[BaseCallbackHandler]] = None,
) -> AgentExecutor:
    """Create a LangChain AgentExecutor using existing MCP tools."""
    if llm is None:
        base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        api_key = os.getenv("LLM_API_KEY", "")
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        llm = ChatOpenAI(api_key=api_key, base_url=base_url, model=model, streaming=True)

    SYSTEM_MSG = SystemMessage(content="You are DevPortal-Agent. Use the tools to answer API questions.")
    tools = await _generate_structured_tools()
    prompt = OpenAIFunctionsAgent.create_prompt(system_message=SYSTEM_MSG)
    agent = create_openai_functions_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        callbacks=list(callbacks) if callbacks else None,
        max_iterations=6,
        verbose=True,
    )
