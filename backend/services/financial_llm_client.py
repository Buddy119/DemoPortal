from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger(__name__)


@dataclass
class FinancialLLMToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class FinancialLLMReply:
    content: str | None
    tool_calls: list[FinancialLLMToolCall]
    raw_message: dict[str, Any]


class FinancialLLMClient:
    def __init__(self) -> None:
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.2"))
        self.log_full_payloads = os.getenv("LLM_TRACE_FULL_PAYLOADS", "").lower() == "true"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        trace_label: str = "financial_agent",
        require_tool_call: bool = False,
    ) -> FinancialLLMReply:
        if not self.is_configured:
            raise RuntimeError("LLM_API_KEY is not configured")

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "required" if require_tool_call else "auto"

        logger.info(
            "financial.llm request label=%s model=%s baseUrl=%s temperature=%s requireToolCall=%s messages=%s tools=%s",
            trace_label,
            self.model,
            self.base_url,
            self.temperature,
            require_tool_call,
            _summarize_messages(messages),
            _tool_names(tools),
        )
        if self.log_full_payloads:
            logger.info("financial.llm request_payload label=%s payload=%s", trace_label, _safe_json(payload))

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if response.status_code >= 400 and require_tool_call and payload.get("tool_choice") == "required":
                logger.warning(
                    "financial.llm required_tool_choice_rejected label=%s status=%s; retrying with auto tool choice",
                    trace_label,
                    response.status_code,
                )
                payload["tool_choice"] = "auto"
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
            response.raise_for_status()
            data = response.json()

        message = data["choices"][0]["message"]
        logger.info(
            "financial.llm response label=%s status=%s finishReason=%s contentPreview=%r toolCalls=%s usage=%s",
            trace_label,
            response.status_code,
            data["choices"][0].get("finish_reason"),
            _preview(message.get("content")),
            _summarize_tool_calls(message.get("tool_calls") or []),
            data.get("usage"),
        )
        if self.log_full_payloads:
            logger.info("financial.llm response_payload label=%s payload=%s", trace_label, _safe_json(data))

        tool_calls: list[FinancialLLMToolCall] = []
        for call in message.get("tool_calls") or []:
            arguments = call.get("function", {}).get("arguments") or "{}"
            if isinstance(arguments, str):
                try:
                    parsed_arguments = json.loads(arguments)
                except json.JSONDecodeError:
                    parsed_arguments = {}
            else:
                parsed_arguments = arguments
            tool_calls.append(
                FinancialLLMToolCall(
                    id=call.get("id", call.get("function", {}).get("name", "tool-call")),
                    name=call.get("function", {}).get("name", ""),
                    arguments=parsed_arguments,
                )
            )
        return FinancialLLMReply(
            content=message.get("content"),
            tool_calls=tool_calls,
            raw_message=message,
        )


def _preview(value: Any, max_len: int = 500) -> str | None:
    if value is None:
        return None
    compact = " ".join(str(value).split())
    return compact if len(compact) <= max_len else f"{compact[:max_len]}..."


def _tool_names(tools: list[dict[str, Any]] | None) -> list[str]:
    return [tool.get("function", {}).get("name", "unknown") for tool in tools or []]


def _summarize_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    summary: list[dict[str, Any]] = []
    for index, message in enumerate(messages):
        item = {
            "index": index,
            "role": message.get("role"),
            "name": message.get("name"),
            "tool_call_id": message.get("tool_call_id"),
            "content": _preview(message.get("content")),
        }
        if message.get("tool_calls"):
            item["toolCalls"] = _summarize_tool_calls(message.get("tool_calls") or [])
        summary.append({key: value for key, value in item.items() if value is not None})
    return summary


def _summarize_tool_calls(tool_calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
    summaries: list[dict[str, Any]] = []
    for call in tool_calls:
        function = call.get("function", {})
        arguments = function.get("arguments")
        if isinstance(arguments, str):
            arguments_preview = _preview(arguments, 300)
        else:
            arguments_preview = arguments
        summaries.append(
            {
                "id": call.get("id"),
                "name": function.get("name"),
                "arguments": arguments_preview,
            }
        )
    return summaries


def _safe_json(value: Any) -> str:
    return json.dumps(value, default=str, ensure_ascii=False)
