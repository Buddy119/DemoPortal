export const apiData = {
    apis: [
        // ────────────────  Dynamic Client Registration  ────────────────
        {
            id: 'dcr-register-client',
            name: 'Register OAuth Client',
            description: 'Create (register) a software product client with the Data Holder’s Authorisation Server.',
            endpoint: '/cdr-register/v1/{softwareProductId}/client',
            method: 'POST',
            parameters: [
                {
                    name: 'softwareProductId',
                    type: 'string',
                    description: 'Path param – ADR software product identifier.'
                }
            ],
            curlExample: `curl -X POST '<baseURL>/cdr-register/v1/8e4c07d3/client' \\
  -H 'Content-Type: application/json' \\
  -d '{ "redirect_uris": ["https://app.example/callback"], "token_endpoint_auth_method": "private_key_jwt", ... }'`,
            responseExample: '{ "client_id": "dfe6ab…", "client_name": "My ADR Mobile", "token_endpoint_auth_method": "private_key_jwt", ... }',
            fields: [
                {name: 'client_id', type: 'string', description: 'Unique client identifier assigned by Data Holder.'}
            ]
        },
        {
            id: 'dcr-get-client',
            name: 'Get Registered Client',
            description: 'Retrieve the current registration details for an ADR software product.',
            endpoint: '/cdr-register/v1/{softwareProductId}/client',
            method: 'GET',
            parameters: [
                {name: 'softwareProductId', type: 'string', description: 'Software product identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cdr-register/v1/8e4c07d3/client' -H 'Authorization: Bearer <client_registration_access_token>'`,
            responseExample: '{ "client_id": "dfe6ab…", "redirect_uris": [...], "jwks_uri": "…" }',
            fields: []
        },
        {
            id: 'dcr-update-client',
            name: 'Update Registered Client',
            description: 'Update an existing client registration (Full replace).',
            endpoint: '/cdr-register/v1/{softwareProductId}/client',
            method: 'PUT',
            parameters: [
                {name: 'softwareProductId', type: 'string', description: 'Software product identifier.'}
            ],
            curlExample: `curl -X PUT '<baseURL>/cdr-register/v1/8e4c07d3/client' -d '{ /* full client metadata */ }'`,
            responseExample: '{ "client_id": "dfe6ab…", "redirect_uris": [...] }',
            fields: []
        },
        {
            id: 'dcr-delete-client',
            name: 'Delete Registered Client',
            description: 'Remove a dynamic client registration.',
            endpoint: '/cdr-register/v1/{softwareProductId}/client',
            method: 'DELETE',
            parameters: [
                {name: 'softwareProductId', type: 'string', description: 'Software product identifier.'}
            ],
            curlExample: `curl -X DELETE '<baseURL>/cdr-register/v1/8e4c07d3/client' -H 'Authorization: Bearer <client_registration_access_token>'`,
            responseExample: '',
            fields: []
        },

// ────────────────  OAuth 2.0 / FAPI Auth Server  ────────────────
        {
            id: 'oauth-authorize',
            name: 'Authorisation Endpoint',
            description: 'Initiate the OAuth 2.0 / OIDC authorisation code flow (Hybrid PAR-preferred).',
            endpoint: '/authorize',
            method: 'GET',
            parameters: [
                {name: 'client_id', type: 'string', description: 'ADR client_id.'},
                {name: 'response_type', type: 'string', description: 'Always “code id_token”.'},
                {name: 'redirect_uri', type: 'string', description: 'Registered redirect.'},
                {name: 'scope', type: 'string', description: 'e.g. openid profile banking:accounts.basic:read …'},
                {name: 'state', type: 'string', description: 'CSRF token.'},
                {name: 'nonce', type: 'string', description: 'OIDC replay protection.'}
            ],
            curlExample: '## typically invoked by browser redirect, not cURL',
            responseExample: 'HTTP 302 with code & id_token in fragment',
            fields: []
        },
        {
            id: 'oauth-par',
            name: 'Pushed Authorisation Request (PAR)',
            description: 'Push authorisation params to AS for CDR-compliant FAPI flow; returns `request_uri`.',
            endpoint: '/par',
            method: 'POST',
            parameters: [
                {name: 'client_id', type: 'string', description: 'ADR client_id.'},
                {name: 'request', type: 'string', description: 'JWS-signed request object.'}
            ],
            curlExample: `curl -X POST '<baseURL>/par' \\
  -u '<client_id>:<client_secret>' \\
  -d 'request=<signed_jws>'`,
            responseExample: '{ "request_uri": "urn:cds.par:1234", "expires_in": 90 }',
            fields: [
                {name: 'request_uri', type: 'string', description: 'Opaque reference passed to /authorize.'}
            ]
        },
        {
            id: 'oauth-token',
            name: 'Token Endpoint',
            description: 'Exchange authorisation code or refresh token for access/refresh tokens.',
            endpoint: '/token',
            method: 'POST',
            parameters: [
                {name: 'grant_type', type: 'string', description: 'code | refresh_token | client_credentials'},
                {name: 'code', type: 'string', description: 'Auth code when grant_type=code.'},
                {name: 'redirect_uri', type: 'string', description: 'Same as in /authorize.'},
                {name: 'refresh_token', type: 'string', description: 'When grant_type=refresh_token.'},
                {name: 'client_id', type: 'string', description: 'ADR client_id (if public).'}
            ],
            curlExample: `curl -X POST '<baseURL>/token' \\
  -u '<client_id>:<client_secret>' \\
  -d 'grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA&redirect_uri=https://app.example/callback'`,
            responseExample: '{ "access_token": "...", "expires_in": 1800, "refresh_token": "...", "id_token": "..." }',
            fields: [
                {name: 'access_token', type: 'string', description: 'Bearer token for CDR resource APIs.'}
            ]
        },
        {
            id: 'oauth-revoke',
            name: 'Token Revocation',
            description: 'Revoke an access or refresh token.',
            endpoint: '/revoke',
            method: 'POST',
            parameters: [
                {name: 'token', type: 'string', description: 'Token to be revoked.'},
                {name: 'token_type_hint', type: 'string', description: 'access_token | refresh_token'}
            ],
            curlExample: `curl -X POST '<baseURL>/revoke' -u '<client_id>:<client_secret>' -d 'token=<refresh_token>'`,
            responseExample: 'HTTP 200 empty body',
            fields: []
        },
        {
            id: 'oauth-introspect',
            name: 'Token Introspection',
            description: 'Validate a token and obtain active/claims metadata.',
            endpoint: '/introspect',
            method: 'POST',
            parameters: [
                {name: 'token', type: 'string', description: 'Token to introspect.'}
            ],
            curlExample: `curl -X POST '<baseURL>/introspect' -u '<client_id>:<client_secret>' -d 'token=<access_token>'`,
            responseExample: '{ "active": true, "scope": "banking:accounts.basic:read", "sub": "12345", "exp": 1716888912 }',
            fields: [
                {name: 'active', type: 'boolean', description: 'Whether the token is valid and unexpired.'}
            ]
        },
        /* ────────────────  Products  ──────────────── */
        {
            id: 'get-products',
            name: 'Get Products',
            description: 'List all publicly available banking products.',
            endpoint: '/cds-au/v1/banking/products',
            method: 'GET',
            parameters: [
                {
                    name: 'product-category',
                    type: 'string',
                    description: 'Optional filter by product category (e.g. TRANS_AND_SAVINGS_ACCOUNTS).'
                },
                {name: 'effective', type: 'string', description: 'Filter by effective date (CURRENT | FUTURE).'},
                {name: 'page', type: 'integer', description: 'Page number for pagination.'},
                {name: 'page-size', type: 'integer', description: 'Number of records per page.'}
            ],
            curlExample: `curl --location --request GET '<baseURL>/cds-au/v1/banking/products?page=1&page-size=25' -H 'x-v: 3'`,
            responseExample: '{ "data": { "products": [ /* … */ ] }, "links": { "self": "…" }, "meta": { "totalRecords": 200 } }',
            fields: [
                {name: 'productId', type: 'string', description: 'CDR-wide unique product identifier.'},
                {name: 'name', type: 'string', description: 'Product display name.'},
                {name: 'description', type: 'string', description: 'Marketing description.'}
            ]
        },
        {
            id: 'get-product-detail',
            name: 'Get Product Detail',
            description: 'Retrieve full detail for a specific product.',
            endpoint: '/cds-au/v1/banking/products/{productId}',
            method: 'GET',
            parameters: [
                {name: 'productId', type: 'string', description: 'Path parameter – product identifier.'}
            ],
            curlExample: `curl --location GET '<baseURL>/cds-au/v1/banking/products/dd45fe9f-e8c7-498e' -H 'x-v: 3'`,
            responseExample: '{ "data": { "product": { "productId": "…", "name": "…", "bundles": [] } } }',
            fields: [
                {name: 'bundles', type: 'array', description: 'Array of bundled products available.'}
            ]
        },

        /* ────────────────  Accounts  ──────────────── */
        {
            id: 'get-accounts',
            name: 'Get Accounts',
            description: 'List authorised customer’s accounts (summary view).',
            endpoint: '/cds-au/v1/banking/accounts',
            method: 'GET',
            parameters: [
                {name: 'type', type: 'string', description: 'Filter by account type.'},
                {name: 'open-status', type: 'string', description: 'Filter open or closed accounts.'},
                {name: 'page', type: 'integer', description: 'Pagination page.'},
                {name: 'page-size', type: 'integer', description: 'Records per page.'}
            ],
            curlExample: `curl --location GET '<baseURL>/cds-au/v1/banking/accounts?open-status=OPEN&page=1&page-size=25' -H 'x-v: 3' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "accounts": [ { "accountId": "123", "nickname": "Everyday" } ] } }',
            fields: [
                {name: 'accountId', type: 'string', description: 'Internal account identifier.'},
                {name: 'nickname', type: 'string', description: 'User-defined name.'}
            ]
        },
        {
            id: 'get-account-detail',
            name: 'Get Account Detail',
            description: 'Detailed information for a specific account.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Path parameter – account identifier.'}
            ],
            curlExample: `curl --location GET '<baseURL>/cds-au/v1/banking/accounts/12345' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "account": { "accountId": "12345", "nickname": "Everyday", "accountNumber": "111-222" } } }',
            fields: [
                {name: 'accountNumber', type: 'string', description: 'BSB / account number formatted per standards.'}
            ]
        },

        /* ────────────────  Balances  ──────────────── */
        {
            id: 'get-bulk-balances',
            name: 'Get Bulk Balances',
            description: 'Retrieve balances for many or all authorised accounts.',
            endpoint: '/cds-au/v1/banking/accounts/balances',
            method: 'GET',
            parameters: [
                {name: 'accountIds', type: 'string', description: 'Optional CSV of accountIds to filter.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/balances?accountIds=123,456' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "balances": [ { "accountId": "123", "available": "100.55" } ] } }',
            fields: [
                {name: 'available', type: 'string', description: 'Available balance.'}
            ]
        },
        {
            id: 'get-account-balance',
            name: 'Get Account Balance',
            description: 'Balance for a single account.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}/balance',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Account identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/123/balance' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "accountId": "123", "current": "102.00" } }',
            fields: [
                {name: 'current', type: 'string', description: 'Current balance.'}
            ]
        },

        /* ────────────────  Transactions  ──────────────── */
        {
            id: 'get-account-transactions',
            name: 'Get Transactions For Account',
            description: 'List transactions for a specific account.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}/transactions',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Account identifier.'},
                {name: 'newest-time', type: 'string', description: 'Filter upper bound ISO 8601 timestamp.'},
                {name: 'oldest-time', type: 'string', description: 'Filter lower bound ISO 8601 timestamp.'},
                {name: 'limit', type: 'integer', description: 'Max transactions to return.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/123/transactions?limit=50' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "transactions": [ { "transactionId": "tx-1", "amount": "-12.50" } ] } }',
            fields: [
                {name: 'transactionId', type: 'string', description: 'Unique transaction ID.'},
                {name: 'amount', type: 'string', description: 'Signed decimal amount.'}
            ]
        },
        {
            id: 'get-transaction-detail',
            name: 'Get Transaction Detail',
            description: 'Detailed data for a single transaction.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}/transactions/{transactionId}',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Account identifier.'},
                {name: 'transactionId', type: 'string', description: 'Transaction identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/123/transactions/tx-1' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "transaction": { "transactionId": "tx-1", "description": "Coffee Shop" } } }',
            fields: [
                {name: 'description', type: 'string', description: 'Merchant or payee description.'}
            ]
        },

        /* ────────────────  Direct Debits  ──────────────── */
        {
            id: 'get-account-direct-debits',
            name: 'Get Direct Debits For Account',
            description: 'Direct Debit authorisations for a given account.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}/direct-debits',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Account identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/123/direct-debits' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "directDebits": [ { "bsb": "123-456", "accountNumber": "000123" } ] } }',
            fields: [
                {name: 'bsb', type: 'string', description: 'BSB used for debit.'}
            ]
        },
        {
            id: 'get-bulk-direct-debits',
            name: 'Get Bulk Direct Debits',
            description: 'Direct Debit authorisations across many accounts.',
            endpoint: '/cds-au/v1/banking/accounts/direct-debits',
            method: 'GET',
            parameters: [
                {name: 'accountIds', type: 'string', description: 'Optional CSV filter.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/direct-debits' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "directDebits": [] } }',
            fields: []
        },

        /* ────────────────  Scheduled Payments  ──────────────── */
        {
            id: 'get-account-scheduled-payments',
            name: 'Get Scheduled Payments For Account',
            description: 'Scheduled/standing payments for an account.',
            endpoint: '/cds-au/v1/banking/accounts/{accountId}/scheduled-payments',
            method: 'GET',
            parameters: [
                {name: 'accountId', type: 'string', description: 'Account identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/123/scheduled-payments' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "scheduledPayments": [] } }',
            fields: []
        },
        {
            id: 'get-bulk-scheduled-payments',
            name: 'Get Bulk Scheduled Payments',
            description: 'Scheduled payments across many accounts.',
            endpoint: '/cds-au/v1/banking/accounts/scheduled-payments',
            method: 'GET',
            parameters: [
                {name: 'accountIds', type: 'string', description: 'Optional CSV filter.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/accounts/scheduled-payments' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "scheduledPayments": [] } }',
            fields: []
        },

        /* ────────────────  Payees  ──────────────── */
        {
            id: 'get-payees',
            name: 'Get Payees',
            description: 'List all payees saved by the customer.',
            endpoint: '/cds-au/v1/banking/payees',
            method: 'GET',
            parameters: [
                {
                    name: 'type',
                    type: 'string',
                    description: 'Filter by payee type (DOMESTIC | INTERNATIONAL | BILLER).'
                },
                {name: 'page', type: 'integer', description: 'Pagination.'},
                {name: 'page-size', type: 'integer', description: 'Records per page.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/payees?page=1&page-size=50' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "payees": [ { "payeeId": "p1", "nickname": "Mum" } ] } }',
            fields: [
                {name: 'payeeId', type: 'string', description: 'Unique payee identifier.'}
            ]
        },
        {
            id: 'get-payee-detail',
            name: 'Get Payee Detail',
            description: 'Detail for a single payee.',
            endpoint: '/cds-au/v1/banking/payees/{payeeId}',
            method: 'GET',
            parameters: [
                {name: 'payeeId', type: 'string', description: 'Payee identifier.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/banking/payees/p1' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "payee": { "payeeId": "p1", "nickname": "Mum" } } }',
            fields: []
        },

        /* ────────────────  Common APIs  ──────────────── */
        {
            id: 'get-customer',
            name: 'Get Customer',
            description: 'Basic profile for authorised customer.',
            endpoint: '/cds-au/v1/common/customer',
            method: 'GET',
            parameters: [],
            curlExample: `curl GET '<baseURL>/cds-au/v1/common/customer' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "customer": { "givenName": "Jane" } } }',
            fields: [
                {name: 'givenName', type: 'string', description: 'First name.'}
            ]
        },
        {
            id: 'get-customer-detail',
            name: 'Get Customer Detail',
            description: 'Detailed profile for authorised customer.',
            endpoint: '/cds-au/v1/common/customer/detail',
            method: 'GET',
            parameters: [],
            curlExample: `curl GET '<baseURL>/cds-au/v1/common/customer/detail' -H 'Authorization: Bearer <access_token>'`,
            responseExample: '{ "data": { "customer": { "occupationCode": "2533" } } }',
            fields: [
                {name: 'occupationCode', type: 'string', description: 'ANZSCO occupation code.'}
            ]
        },
        {
            id: 'get-common-status',
            name: 'Get Data Holder Status',
            description: 'Current availability status of Data Holder APIs.',
            endpoint: '/cds-au/v1/common/status',
            method: 'GET',
            parameters: [],
            curlExample: `curl GET '<baseURL>/cds-au/v1/common/status'`,
            responseExample: '{ "data": { "status": "AVAILABLE" } }',
            fields: [
                {name: 'status', type: 'string', description: 'AVAILABLE | UNAVAILABLE'}
            ]
        },
        {
            id: 'get-common-outages',
            name: 'Get Planned Outages',
            description: 'List of planned or current outages.',
            endpoint: '/cds-au/v1/common/outages',
            method: 'GET',
            parameters: [
                {name: 'page', type: 'integer', description: 'Pagination.'}
            ],
            curlExample: `curl GET '<baseURL>/cds-au/v1/common/outages'`,
            responseExample: '{ "data": { "outages": [] } }',
            fields: []
        }
    ],
};
