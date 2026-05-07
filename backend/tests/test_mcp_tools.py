import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.mcp_client import (
    APIS,
    list_apis,
    get_api_details,
    get_api_sample,
    search_apis,
    get_api_parameters,
    get_api_response_example,
    compare_api_specs,
    get_api_usage_flow,
)

# FastMCP 2 returned FunctionTool objects; FastMCP 3 keeps decorated symbols as callables.
def tool_fn(tool):
    return getattr(tool, "fn", tool)


list_apis_fn = tool_fn(list_apis)
get_api_details_fn = tool_fn(get_api_details)
get_api_sample_fn = tool_fn(get_api_sample)
search_apis_fn = tool_fn(search_apis)
get_api_parameters_fn = tool_fn(get_api_parameters)
get_api_response_example_fn = tool_fn(get_api_response_example)
compare_api_specs_fn = tool_fn(compare_api_specs)
get_api_usage_flow_fn = tool_fn(get_api_usage_flow)


def test_list_apis():
    apis = list_apis_fn()
    assert len(apis) == len(APIS)
    assert all({"name", "method", "endpoint", "description"} <= api.keys() for api in apis)


def test_get_api_details_success():
    name = APIS[0]["name"]
    details = get_api_details_fn(name)
    assert details["name"] == name


def test_get_api_details_failure():
    with pytest.raises(ValueError):
        get_api_details_fn("unknown")


def test_get_api_sample_success():
    name = APIS[0]["name"]
    sample = get_api_sample_fn(name)
    assert "curl" in sample


def test_get_api_sample_failure():
    with pytest.raises(ValueError):
        get_api_sample_fn("bad")


def test_search_apis():
    results = search_apis_fn(APIS[0]["name"].split()[0])
    assert len(results) >= 1

    empty = search_apis_fn("nonexistent")
    assert empty == []


def test_get_api_parameters():
    name = APIS[0]["name"]
    params = get_api_parameters_fn(name)
    assert isinstance(params, list) and params

    with pytest.raises(ValueError):
        get_api_parameters_fn("bad")


def test_get_api_response_example():
    name = APIS[0]["name"]
    resp = get_api_response_example_fn(name)
    assert isinstance(resp, str) and resp

    with pytest.raises(ValueError):
        get_api_response_example_fn("bad")


def test_compare_api_specs(monkeypatch):
    result_json = {
        "results": [
            {
                "url": "https://psd2.example/auth",
                "content": "Use GET /oauth2/authorize parameters: client_id, redirect_uri. OAuth2 with SCA."
            }
        ]
    }

    def fake_search(self, query, max_results=3):
        assert max_results == 3
        return result_json

    from tavily import TavilyClient
    monkeypatch.setattr(TavilyClient, "search", fake_search)
    monkeypatch.setenv("SEARCH_API_KEY", "x")

    name = APIS[0]["name"]
    table = compare_api_specs_fn(name, "UK PSD2 authorization API")
    assert "/oauth2/authorize" in table


def test_get_api_usage_flow():
    result = get_api_usage_flow_fn("authorization")
    assert "Authorization Flow" in result
    assert "sequenceDiagram" in result

    result = get_api_usage_flow_fn("dcr")
    assert "DCR Flow" in result
    assert "sequenceDiagram" in result

    result = get_api_usage_flow_fn("resource")
    assert "Resource API Usage" in result
    assert "sequenceDiagram" in result
