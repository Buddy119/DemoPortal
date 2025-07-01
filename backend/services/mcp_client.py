import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Literal
import asyncio
import inspect

import fastmcp
from fastmcp import Client, FastMCP

# --- MCP server setup with built-in tools ---------------------------------

APIS = [

    # // ────────────────  Dynamic Client Registration  ────────────────
    {
        "id": "dcr-register-client",
        "name": "Register OAuth Client",
        "description": "Create (register) a software product client with the Data Holder’s Authorisation Server.",
        "endpoint": "/cdr-register/v1/{softwareProductId}/client",
        "method": "POST",
        "parameters": [
            {
                "name": "softwareProductId",
                "type": "string",
                "description": "Path param – ADR software product identifier."
            }
        ],
        "curlExample": "curl -X POST '<baseURL>/cdr-register/v1/8e4c07d3/client' \\\n  -H 'Content-Type: application/json' \\\n  -d '{ \"redirect_uris\": [\"https://app.example/callback\"], \"token_endpoint_auth_method\": \"private_key_jwt\", ... }'",
        "responseExample": "{ \"client_id\": \"dfe6ab…\", \"client_name\": \"My ADR Mobile\", \"token_endpoint_auth_method\": \"private_key_jwt\", ... }",
        "fields": [
            {
                "name": "client_id",
                "type": "string",
                "description": "Unique client identifier assigned by Data Holder."
            }
        ]
    },
    {
        "id": "dcr-get-client",
        "name": "Get Registered Client",
        "description": "Retrieve the current registration details for an ADR software product.",
        "endpoint": "/cdr-register/v1/{softwareProductId}/client",
        "method": "GET",
        "parameters": [
            {
                "name": "softwareProductId",
                "type": "string",
                "description": "Software product identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cdr-register/v1/8e4c07d3/client' -H 'Authorization: Bearer <client_registration_access_token>'",
        "responseExample": "{ \"client_id\": \"dfe6ab…\", \"redirect_uris\": [...], \"jwks_uri\": \"…\" }",
        "fields": []
    },
    {
        "id": "dcr-update-client",
        "name": "Update Registered Client",
        "description": "Update an existing client registration (Full replace).",
        "endpoint": "/cdr-register/v1/{softwareProductId}/client",
        "method": "PUT",
        "parameters": [
            {
                "name": "softwareProductId",
                "type": "string",
                "description": "Software product identifier."
            }
        ],
        "curlExample": "curl -X PUT '<baseURL>/cdr-register/v1/8e4c07d3/client' -d '{ /* full client metadata */ }'",
        "responseExample": "{ \"client_id\": \"dfe6ab…\", \"redirect_uris\": [...] }",
        "fields": []
    },
    {
        "id": "dcr-delete-client",
        "name": "Delete Registered Client",
        "description": "Remove a dynamic client registration.",
        "endpoint": "/cdr-register/v1/{softwareProductId}/client",
        "method": "DELETE",
        "parameters": [
            {
                "name": "softwareProductId",
                "type": "string",
                "description": "Software product identifier."
            }
        ],
        "curlExample": "curl -X DELETE '<baseURL>/cdr-register/v1/8e4c07d3/client' -H 'Authorization: Bearer <client_registration_access_token>'",
        "responseExample": "",
        "fields": []
    },

    # // ────────────────  OAuth 2.0 / FAPI Auth Server  ────────────────
    {
        "id": "oauth-authorize",
        "name": "Authorisation Endpoint",
        "description": "Initiate the OAuth 2.0 / OIDC authorisation code flow (Hybrid PAR-preferred).",
        "endpoint": "/authorize",
        "method": "GET",
        "parameters": [
            {
                "name": "client_id",
                "type": "string",
                "description": "ADR client_id."
            },
            {
                "name": "response_type",
                "type": "string",
                "description": "Always “code id_token”."
            },
            {
                "name": "redirect_uri",
                "type": "string",
                "description": "Registered redirect."
            },
            {
                "name": "scope",
                "type": "string",
                "description": "e.g. openid profile banking:accounts.basic:read …"
            },
            {
                "name": "state",
                "type": "string",
                "description": "CSRF token."
            },
            {
                "name": "nonce",
                "type": "string",
                "description": "OIDC replay protection."
            }
        ],
        "curlExample": "## typically invoked by browser redirect, not cURL",
        "responseExample": "HTTP 302 with code & id_token in fragment",
        "fields": []
    },
    {
        "id": "oauth-par",
        "name": "Pushed Authorisation Request (PAR)",
        "description": "Push authorisation params to AS for CDR-compliant FAPI flow; returns `request_uri`.",
        "endpoint": "/par",
        "method": "POST",
        "parameters": [
            {
                "name": "client_id",
                "type": "string",
                "description": "ADR client_id."
            },
            {
                "name": "request",
                "type": "string",
                "description": "JWS-signed request object."
            }
        ],
        "curlExample": "curl -X POST '<baseURL>/par' \\\n  -u '<client_id>:<client_secret>' \\\n  -d 'request=<signed_jws>'",
        "responseExample": "{ \"request_uri\": \"urn:cds.par:1234\", \"expires_in\": 90 }",
        "fields": [
            {
                "name": "request_uri",
                "type": "string",
                "description": "Opaque reference passed to /authorize."
            }
        ]
    },
    {
        "id": "oauth-token",
        "name": "Token Endpoint",
        "description": "Exchange authorisation code or refresh token for access/refresh tokens.",
        "endpoint": "/token",
        "method": "POST",
        "parameters": [
            {
                "name": "grant_type",
                "type": "string",
                "description": "code | refresh_token | client_credentials"
            },
            {
                "name": "code",
                "type": "string",
                "description": "Auth code when grant_type=code."
            },
            {
                "name": "redirect_uri",
                "type": "string",
                "description": "Same as in /authorize."
            },
            {
                "name": "refresh_token",
                "type": "string",
                "description": "When grant_type=refresh_token."
            },
            {
                "name": "client_id",
                "type": "string",
                "description": "ADR client_id (if public)."
            }
        ],
        "curlExample": "curl -X POST '<baseURL>/token' \\\n  -u '<client_id>:<client_secret>' \\\n  -d 'grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https://app.example/callback'",
        "responseExample": "{ \"access_token\": \"...\", \"expires_in\": 1800, \"refresh_token\": \"...\", \"id_token\": \"...\" }",
        "fields": [
            {
                "name": "access_token",
                "type": "string",
                "description": "Bearer token for CDR resource APIs."
            }
        ]
    },
    {
        "id": "oauth-revoke",
        "name": "Token Revocation",
        "description": "Revoke an access or refresh token.",
        "endpoint": "/revoke",
        "method": "POST",
        "parameters": [
            {
                "name": "token",
                "type": "string",
                "description": "Token to be revoked."
            },
            {
                "name": "token_type_hint",
                "type": "string",
                "description": "access_token | refresh_token"
            }
        ],
        "curlExample": "curl -X POST '<baseURL>/revoke' -u '<client_id>:<client_secret>' -d 'token=<refresh_token>'",
        "responseExample": "HTTP 200 empty body",
        "fields": []
    },
    {
        "id": "oauth-introspect",
        "name": "Token Introspection",
        "description": "Validate a token and obtain active/claims metadata.",
        "endpoint": "/introspect",
        "method": "POST",
        "parameters": [
            {
                "name": "token",
                "type": "string",
                "description": "Token to introspect."
            }
        ],
        "curlExample": "curl -X POST '<baseURL>/introspect' -u '<client_id>:<client_secret>' -d 'token=<access_token>'",
        "responseExample": "{ \"active\": true, \"scope\": \"banking:accounts.basic:read\", \"sub\": \"12345\", \"exp\": 1716888912 }",
        "fields": [
            {
                "name": "active",
                "type": "boolean",
                "description": "Whether the token is valid and unexpired."
            }
        ]
    },
    # /* ────────────────  Products  ──────────────── */
    {
        "id": "get-products",
        "name": "Get Products",
        "description": "List all publicly available banking products.",
        "endpoint": "/cds-au/v1/banking/products",
        "method": "GET",
        "parameters": [
            {
                "name": "product-category",
                "type": "string",
                "description": "Optional filter by product category (e.g. TRANS_AND_SAVINGS_ACCOUNTS)."
            },
            {
                "name": "effective",
                "type": "string",
                "description": "Filter by effective date (CURRENT | FUTURE)."
            },
            {
                "name": "page",
                "type": "integer",
                "description": "Page number for pagination."
            },
            {
                "name": "page-size",
                "type": "integer",
                "description": "Number of records per page."
            }
        ],
        "curlExample": "curl --location --request GET '<baseURL>/cds-au/v1/banking/products?page=1&page-size=25' -H 'x-v: 3'",
        "responseExample": "{ \"data\": { \"products\": [ /* … */ ] }, \"links\": { \"self\": \"…\" }, \"meta\": { \"totalRecords\": 200 } }",
        "fields": [
            {
                "name": "productId",
                "type": "string",
                "description": "CDR-wide unique product identifier."
            },
            {
                "name": "name",
                "type": "string",
                "description": "Product display name."
            },
            {
                "name": "description",
                "type": "string",
                "description": "Marketing description."
            }
        ]
    },
    {
        "id": "get-product-detail",
        "name": "Get Product Detail",
        "description": "Retrieve full detail for a specific product.",
        "endpoint": "/cds-au/v1/banking/products/{productId}",
        "method": "GET",
        "parameters": [
            {
                "name": "productId",
                "type": "string",
                "description": "Path parameter – product identifier."
            }
        ],
        "curlExample": "curl --location GET '<baseURL>/cds-au/v1/banking/products/dd45fe9f-e8c7-498e' -H 'x-v: 3'",
        "responseExample": "{ \"data\": { \"product\": { \"productId\": \"…\", \"name\": \"…\", \"bundles\": [] } } }",
        "fields": [
            {
                "name": "bundles",
                "type": "array",
                "description": "Array of bundled products available."
            }
        ]
    },

    # /* ────────────────  Accounts  ──────────────── */
    {
        "id": "get-accounts",
        "name": "Get Accounts",
        "description": "List authorised customer’s accounts (summary view).",
        "endpoint": "/cds-au/v1/banking/accounts",
        "method": "GET",
        "parameters": [
            {
                "name": "type",
                "type": "string",
                "description": "Filter by account type."
            },
            {
                "name": "open-status",
                "type": "string",
                "description": "Filter open or closed accounts."
            },
            {
                "name": "page",
                "type": "integer",
                "description": "Pagination page."
            },
            {
                "name": "page-size",
                "type": "integer",
                "description": "Records per page."
            }
        ],
        "curlExample": "curl --location GET '<baseURL>/cds-au/v1/banking/accounts?open-status=OPEN&page=1&page-size=25' -H 'x-v: 3' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"accounts\": [ { \"accountId\": \"123\", \"nickname\": \"Everyday\" } ] } }",
        "fields": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Internal account identifier."
            },
            {
                "name": "nickname",
                "type": "string",
                "description": "User-defined name."
            }
        ]
    },
    {
        "id": "get-account-detail",
        "name": "Get Account Detail",
        "description": "Detailed information for a specific account.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Path parameter – account identifier."
            }
        ],
        "curlExample": "curl --location GET '<baseURL>/cds-au/v1/banking/accounts/12345' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"account\": { \"accountId\": \"12345\", \"nickname\": \"Everyday\", \"accountNumber\": \"111-222\" } } }",
        "fields": [
            {
                "name": "accountNumber",
                "type": "string",
                "description": "BSB / account number formatted per standards."
            }
        ]
    },

    # /* ────────────────  Balances  ──────────────── */
    {
        "id": "get-bulk-balances",
        "name": "Get Bulk Balances",
        "description": "Retrieve balances for many or all authorised accounts.",
        "endpoint": "/cds-au/v1/banking/accounts/balances",
        "method": "GET",
        "parameters": [
            {
                "name": "accountIds",
                "type": "string",
                "description": "Optional CSV of accountIds to filter."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/balances?accountIds=123,456' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"balances\": [ { \"accountId\": \"123\", \"available\": \"100.55\" } ] } }",
        "fields": [
            {
                "name": "available",
                "type": "string",
                "description": "Available balance."
            }
        ]
    },
    {
        "id": "get-account-balance",
        "name": "Get Account Balance",
        "description": "Balance for a single account.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}/balance",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Account identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/123/balance' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"accountId\": \"123\", \"current\": \"102.00\" } }",
        "fields": [
            {
                "name": "current",
                "type": "string",
                "description": "Current balance."
            }
        ]
    },

    # /* ────────────────  Transactions  ──────────────── */
    {
        "id": "get-account-transactions",
        "name": "Get Transactions For Account",
        "description": "List transactions for a specific account.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}/transactions",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Account identifier."
            },
            {
                "name": "newest-time",
                "type": "string",
                "description": "Filter upper bound ISO 8601 timestamp."
            },
            {
                "name": "oldest-time",
                "type": "string",
                "description": "Filter lower bound ISO 8601 timestamp."
            },
            {
                "name": "limit",
                "type": "integer",
                "description": "Max transactions to return."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/123/transactions?limit=50' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"transactions\": [ { \"transactionId\": \"tx-1\", \"amount\": \"-12.50\" } ] } }",
        "fields": [
            {
                "name": "transactionId",
                "type": "string",
                "description": "Unique transaction ID."
            },
            {
                "name": "amount",
                "type": "string",
                "description": "Signed decimal amount."
            }
        ]
    },
    {
        "id": "get-transaction-detail",
        "name": "Get Transaction Detail",
        "description": "Detailed data for a single transaction.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}/transactions/{transactionId}",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Account identifier."
            },
            {
                "name": "transactionId",
                "type": "string",
                "description": "Transaction identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/123/transactions/tx-1' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"transaction\": { \"transactionId\": \"tx-1\", \"description\": \"Coffee Shop\" } } }",
        "fields": [
            {
                "name": "description",
                "type": "string",
                "description": "Merchant or payee description."
            }
        ]
    },

    # /* ────────────────  Direct Debits  ──────────────── */
    {
        "id": "get-account-direct-debits",
        "name": "Get Direct Debits For Account",
        "description": "Direct Debit authorisations for a given account.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}/direct-debits",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Account identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/123/direct-debits' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"directDebits\": [ { \"bsb\": \"123-456\", \"accountNumber\": \"000123\" } ] } }",
        "fields": [
            {
                "name": "bsb",
                "type": "string",
                "description": "BSB used for debit."
            }
        ]
    },
    {
        "id": "get-bulk-direct-debits",
        "name": "Get Bulk Direct Debits",
        "description": "Direct Debit authorisations across many accounts.",
        "endpoint": "/cds-au/v1/banking/accounts/direct-debits",
        "method": "GET",
        "parameters": [
            {
                "name": "accountIds",
                "type": "string",
                "description": "Optional CSV filter."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/direct-debits' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"directDebits\": [] } }",
        "fields": []
    },

    # /* ────────────────  Scheduled Payments  ──────────────── */
    {
        "id": "get-account-scheduled-payments",
        "name": "Get Scheduled Payments For Account",
        "description": "Scheduled/standing payments for an account.",
        "endpoint": "/cds-au/v1/banking/accounts/{accountId}/scheduled-payments",
        "method": "GET",
        "parameters": [
            {
                "name": "accountId",
                "type": "string",
                "description": "Account identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/123/scheduled-payments' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"scheduledPayments\": [] } }",
        "fields": []
    },
    {
        "id": "get-bulk-scheduled-payments",
        "name": "Get Bulk Scheduled Payments",
        "description": "Scheduled payments across many accounts.",
        "endpoint": "/cds-au/v1/banking/accounts/scheduled-payments",
        "method": "GET",
        "parameters": [
            {
                "name": "accountIds",
                "type": "string",
                "description": "Optional CSV filter."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/accounts/scheduled-payments' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"scheduledPayments\": [] } }",
        "fields": []
    },

    # /* ────────────────  Payees  ──────────────── */
    {
        "id": "get-payees",
        "name": "Get Payees",
        "description": "List all payees saved by the customer.",
        "endpoint": "/cds-au/v1/banking/payees",
        "method": "GET",
        "parameters": [
            {
                "name": "type",
                "type": "string",
                "description": "Filter by payee type (DOMESTIC | INTERNATIONAL | BILLER)."
            },
            {
                "name": "page",
                "type": "integer",
                "description": "Pagination."
            },
            {
                "name": "page-size",
                "type": "integer",
                "description": "Records per page."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/payees?page=1&page-size=50' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"payees\": [ { \"payeeId\": \"p1\", \"nickname\": \"Mum\" } ] } }",
        "fields": [
            {
                "name": "payeeId",
                "type": "string",
                "description": "Unique payee identifier."
            }
        ]
    },
    {
        "id": "get-payee-detail",
        "name": "Get Payee Detail",
        "description": "Detail for a single payee.",
        "endpoint": "/cds-au/v1/banking/payees/{payeeId}",
        "method": "GET",
        "parameters": [
            {
                "name": "payeeId",
                "type": "string",
                "description": "Payee identifier."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/banking/payees/p1' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"payee\": { \"payeeId\": \"p1\", \"nickname\": \"Mum\" } } }",
        "fields": []
    },

    # /* ────────────────  Common APIs  ──────────────── */
    {
        "id": "get-customer",
        "name": "Get Customer",
        "description": "Basic profile for authorised customer.",
        "endpoint": "/cds-au/v1/common/customer",
        "method": "GET",
        "parameters": [],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/common/customer' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"customer\": { \"givenName\": \"Jane\" } } }",
        "fields": [
            {
                "name": "givenName",
                "type": "string",
                "description": "First name."
            }
        ]
    },
    {
        "id": "get-customer-detail",
        "name": "Get Customer Detail",
        "description": "Detailed profile for authorised customer.",
        "endpoint": "/cds-au/v1/common/customer/detail",
        "method": "GET",
        "parameters": [],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/common/customer/detail' -H 'Authorization: Bearer <access_token>'",
        "responseExample": "{ \"data\": { \"customer\": { \"occupationCode\": \"2533\" } } }",
        "fields": [
            {
                "name": "occupationCode",
                "type": "string",
                "description": "ANZSCO occupation code."
            }
        ]
    },
    {
        "id": "get-common-status",
        "name": "Get Data Holder Status",
        "description": "Current availability status of Data Holder APIs.",
        "endpoint": "/cds-au/v1/common/status",
        "method": "GET",
        "parameters": [],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/common/status'",
        "responseExample": "{ \"data\": { \"status\": \"AVAILABLE\" } }",
        "fields": [
            {
                "name": "status",
                "type": "string",
                "description": "AVAILABLE | UNAVAILABLE"
            }
        ]
    },
    {
        "id": "get-common-outages",
        "name": "Get Planned Outages",
        "description": "List of planned or current outages.",
        "endpoint": "/cds-au/v1/common/outages",
        "method": "GET",
        "parameters": [
            {
                "name": "page",
                "type": "integer",
                "description": "Pagination."
            }
        ],
        "curlExample": "curl GET '<baseURL>/cds-au/v1/common/outages'",
        "responseExample": "{ \"data\": { \"outages\": [] } }",
        "fields": []
    }

]

SYSTEM_PROMPT = (
    "You are DevPortal-Bot. Use the provided tools to answer API-related questions.\n"
    "\n"
    "When you need metadata (list, path, method, examples), call that tool instead of guessing.\n"
    "\n"
    "If the question is not API-specific, answer directly."
)

mcp_server = FastMCP(name="DevPortalServer")

# Markdown snippets with Mermaid sequence diagrams for common API flows
DCR_FLOW_MD = """
### DCR Flow
```mermaid
sequenceDiagram
  participant ADR
  participant DataHolder

  ADR->>DataHolder: POST /cdr-register/v1/{softwareProductId}/client
  DataHolder-->>ADR: client_id & registration details
  ADR->>DataHolder: GET/PUT/DELETE client details as needed
```
"""

AUTH_FLOW_MD = """
### Authorization Flow (PAR → Authorize → Token)
```mermaid
sequenceDiagram
  participant ADR
  participant User
  participant AuthServer

  ADR->>AuthServer: POST /par
  AuthServer-->>ADR: request_uri
  ADR->>User: Redirect to /authorize?request_uri=...
  User->>AuthServer: Authenticate & authorize
  AuthServer-->>User: Authorization code
  User-->>ADR: Redirect with code
  ADR->>AuthServer: POST /token (exchange code)
  AuthServer-->>ADR: access_token & id_token
```
"""

RESOURCE_FLOW_MD = """
### Resource API Usage
```mermaid
sequenceDiagram
  participant ADR
  participant ResourceAPI

  ADR->>ResourceAPI: GET /accounts (Authorization: Bearer access_token)
  ResourceAPI-->>ADR: accounts data
  ADR->>ResourceAPI: GET /transactions (Authorization: Bearer access_token)
  ResourceAPI-->>ADR: transactions data
```
"""


@mcp_server.tool(name="get_api_usage_flow")
def get_api_usage_flow(flow: Literal["dcr", "authorization", "resource"]) -> str:
    """Generate a Markdown Mermaid diagram that illustrates how a specific CDR API flow works. Available flows: 'dcr', 'authorization', or 'resource'."""
    flows = {
        "dcr": DCR_FLOW_MD,
        "authorization": AUTH_FLOW_MD,
        "resource": RESOURCE_FLOW_MD,
    }
    return flows[flow]


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


@mcp_server.tool(name="compare_api_specs")
def compare_api_specs(api_name: str, external_query: str) -> str:
    """Compare an internal CDR API with an external API standard.

    ``external_query`` should describe the external API to search for
    (e.g. "UK PSD2 authorization API").  The function performs a web
    search using the Tavily API, extracts any HTTP endpoint and method
    mentioned in the results and returns a markdown table contrasting
    the internal API with the discovered external details.
    """

    from tavily import TavilyClient
    import re

    internal = None
    for api in APIS:
        if api_name.lower() == api["name"].lower():
            internal = api
            break
    if internal is None:
        raise ValueError(f"API '{api_name}' not found")

    api_key = os.getenv("SEARCH_API_KEY", "")
    if not api_key:
        raise RuntimeError("SEARCH_API_KEY not configured")

    tavily_client = TavilyClient(api_key=api_key)
    data = tavily_client.search(query=external_query, max_results=3)

    ext_text = ""
    source_url = ""
    if data.get("results"):
        source_url = data["results"][0].get("url", "")
        ext_text = " ".join(item.get("content", "") for item in data["results"])
    elif data.get("answer"):
        ext_text = data["answer"]

    match = re.search(r"\b(GET|POST|PUT|DELETE|PATCH)\b\s+(https?://\S+|/\S+)", ext_text, re.I)
    ext_method = match.group(1).upper() if match else "N/A"
    ext_endpoint = match.group(2) if match else "N/A"

    params_match = re.search(r"parameters?:\s*([^\n]+)", ext_text, re.I)
    ext_params = params_match.group(1).strip() if params_match else "N/A"

    security_matches = re.findall(r"(OAuth2|FAPI|SCA|OpenID Connect)", ext_text, re.I)
    ext_security = ", ".join(dict.fromkeys(m.upper() for m in security_matches)) or "N/A"

    internal_params = ", ".join(p["name"] for p in internal.get("parameters", [])) or "N/A"

    table = [
        "| Feature | Australian CDR | External API |",
        "|---------|---------------|--------------|",
        f"| Endpoint | {internal['endpoint']} | {ext_endpoint} |",
        f"| HTTP Method | {internal['method']} | {ext_method} |",
        f"| Required Parameters | {internal_params} | {ext_params} |",
        f"| Security Protocol | FAPI compliant | {ext_security} |",
    ]
    if source_url:
        table.append(f"| Documentation Source | [CDR docs](https://cdr.example) | [Link]({source_url}) |")

    return "\n".join(table)


@mcp_server.tool(name="web_search")
async def web_search(query: str) -> str:
    """Perform a web search using the Tavily API and return a summary."""
    from tavily import TavilyClient
    import asyncio

    api_key = os.getenv("SEARCH_API_KEY", "")
    if not api_key:
        raise RuntimeError("SEARCH_API_KEY not configured")

    tavily_client = TavilyClient(api_key=api_key)
    data = await asyncio.to_thread(tavily_client.search, query=query, max_results=3)

    if data.get("answer"):
        return data["answer"]
    if data.get("results"):
        return " ".join(item.get("content", "") for item in data["results"])
    return ""


# --- LLM chat helper ------------------------------------------------------

@dataclass
class ToolCall:
    name: str
    arguments: Dict[str, Any]


@dataclass
class LLMReply:
    content: Optional[str]
    tool_call: Optional[ToolCall] = None


async def get_cached_tools(session: Client, include_search: bool) -> List[Dict[str, Any]]:
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
    tools = session._cached_tools
    if not include_search:
        tools = [t for t in tools if t.get("function", {}).get("name") != "web_search"]
    return tools


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

    async def complete(self, context: Dict[str, Any], user_query: str, *, include_search: bool = False) -> Completion:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_query},
        ]
        async with self._client as session:
            tools_json = await get_cached_tools(session, include_search)
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

# LangChain adapter for MCP tools --------------------------------------------
from langchain.tools import StructuredTool


async def _generate_structured_tools() -> list[StructuredTool]:
    """Convert registered FastMCP tools to LangChain StructuredTool objects."""
    get_tools = getattr(mcp_server, "get_tools", None)
    if inspect.iscoroutinefunction(get_tools):
        tools = await get_tools()
    elif callable(get_tools):
        tools = get_tools()
    else:
        tools = mcp_server.list_tools()

    tool_iter = tools.values() if isinstance(tools, dict) else tools

    return [
        StructuredTool.from_function(
            t.fn,
            name=t.name,
            description=t.description or "",
        )
        for t in tool_iter
    ]

