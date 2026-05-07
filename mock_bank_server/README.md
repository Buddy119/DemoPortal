# External Mock Bank Server

Standalone mock ASPSP/data server for the DemoPortal financial assistant.

It owns mock AIS data and mock payment APIs. The main backend remains the
assistant/orchestration service and calls this server when
`FINANCIAL_MOCK_BASE_URL` is set.

## Run

```bash
cd mock_bank_server
/Users/buddy/IdeaProjects/DemoPortal/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8020 --reload
```

Then start the main backend with:

```bash
cd backend
FINANCIAL_MOCK_BASE_URL=http://127.0.0.1:8020 /Users/buddy/IdeaProjects/DemoPortal/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

## Endpoints

- `GET /obie/open-banking/v4.0/aisp/accounts`
- `GET /obie/open-banking/v4.0/aisp/balances`
- `GET /obie/open-banking/v4.0/aisp/accounts/{accountId}/balances`
- `GET /obie/open-banking/v4.0/aisp/transactions`
- `GET /obie/open-banking/v4.0/aisp/accounts/{accountId}/transactions`
- `POST /obie/open-banking/v4.0/pisp/domestic-payments`
- `POST /obie/open-banking/v4.0/pisp/domestic-scheduled-payments`
- `POST /obie/open-banking/v4.0/pisp/domestic-vrps`

Immediate mock payments mutate this project’s `data/mockAccounts.json` and
`data/mockTransactions.json`. Scheduled payments and VRP arrangements do not
mutate balances or transactions.
