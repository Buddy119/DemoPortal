# DemoPortal

This demo project provides a basic React page built with Tailwind CSS and shadcn/ui-style components. It lists API documentation items and includes an interactive floating chat window.

The chat window can now highlight sections of the page when the backend sends a
`highlightSelector` over the WebSocket connection. Highlighted elements briefly
animate with a yellow ring to draw attention to relevant documentation.

The backend now uses the MCP Python SDK to manage context and generate
example `curl` commands in response to chat messages. Context and highlighting
information are handled via MCP instead of manual WebSocket payloads.

When Agent Mode is enabled, the LLM can make real-time web searches via the
Tavily API. Set a `SEARCH_API_KEY` in your `.env` file for this feature.

Agent Mode now leverages **LangChain's AgentExecutor** to autonomously call MCP
tools. Streaming responses are delivered via a Server-Sent Events (SSE) endpoint
so tokens appear progressively in the chat UI.

## Getting Started

Install dependencies (if your environment allows network access) from the
`src/front_end` directory:

```bash
cd src/front_end
npm install
```

Start the development server from the same directory:

```bash
npm run dev
```
Then open `http://localhost:3000` in your browser.

## Backend Server

The backend uses FastAPI. To run it locally:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

Execute the WebSocket unit tests with:

```bash
pytest tests/test_websocket.py
```
