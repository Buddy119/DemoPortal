# DemoPortal

This demo project provides a basic React page built with Tailwind CSS and shadcn/ui-style components. It lists API documentation items and includes an interactive floating chat window.

The chat window can now highlight sections of the page when the backend sends a
`highlightSelector` over the WebSocket connection. Highlighted elements briefly
animate with a yellow ring to draw attention to relevant documentation.

## Getting Started

Install dependencies (if your environment allows network access) from the
`src/front_end` directory:

```bash
cd src/front_end
npm install
```

Start the development server from the same directory:

```bash
npm start
```

Then open `http://localhost:3000` in your browser.

## Backend Server

The backend uses FastAPI. To run it locally:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
