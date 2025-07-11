# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Vite)
```bash
cd src/front_end
npm install          # Install dependencies
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Jest tests
```

### Backend (FastAPI + Python)
```bash
cd backend
pip install -r requirements.txt  # Install Python dependencies
uvicorn main:app --host 0.0.0.0 --port 8000 --reload  # Start backend server
pytest tests/test_websocket.py   # Run WebSocket tests
pytest                          # Run all tests
```

## Architecture Overview

This is a dual-stack application combining React frontend with FastAPI backend, designed as an API documentation portal with interactive chat capabilities.

### Frontend Structure
- **React + Vite**: Modern frontend build system with hot reloading
- **Tailwind CSS + shadcn/ui**: Styling framework with component library
- **Socket.IO Client**: Real-time WebSocket communication
- **Key Components**:
  - `ChatWindow.jsx`: Interactive chat interface with WebSocket support
  - `MarkdownRenderer.jsx`: Renders chat responses with syntax highlighting and Mermaid diagrams
  - `ApiCard.jsx`/`ApiList.jsx`: API documentation display components
  - `useElementHighlight.js`: Custom hook for highlighting page elements

### Backend Structure
- **FastAPI**: Modern async Python web framework
- **MCP (Model Context Protocol)**: Uses FastMCP for LLM tool integration
- **LangChain AgentExecutor**: Autonomous tool calling with streaming responses
- **Socket.IO**: WebSocket server for real-time communication
- **Key Services**:
  - `mcp_client.py`: MCP server with API documentation tools
  - `agent_factory.py`: LangChain agent creation using MCP tools
  - `mode_handlers.py`: Different chat modes (normal vs agent)
  - `websocket.py`: WebSocket event handlers

### Key Features
- **Real-time Chat**: WebSocket-based chat with streaming responses
- **Agent Mode**: LangChain-powered autonomous tool calling with web search (requires `SEARCH_API_KEY`)
- **Element Highlighting**: Backend can highlight frontend elements via `highlightSelector` WebSocket messages
- **API Documentation**: Comprehensive API docs with interactive examples
- **MCP Integration**: Tools for generating curl examples and API responses

### Environment Variables
- `LLM_BASE_URL`: LLM API base URL (defaults to OpenAI)
- `LLM_API_KEY`: API key for LLM service
- `LLM_MODEL`: Model name (defaults to gpt-4o-mini)
- `SEARCH_API_KEY`: Tavily API key for web search in Agent Mode

### Testing
- Frontend: Jest with React Testing Library
- Backend: pytest with async support for WebSocket testing
- Test files located in `src/front_end/src/hooks/__tests__/` and `backend/tests/`

## Development Notes

The application uses a unique MCP-based architecture where the backend serves as an MCP server, providing structured tools that can be used by LangChain agents. This allows the chat system to dynamically interact with API documentation and provide contextual responses.

The frontend-backend communication happens through both WebSocket (for real-time chat) and SSE (Server-Sent Events) for streaming agent responses.