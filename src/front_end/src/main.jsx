import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import DocsPage from './pages/DocsPage.jsx';
import ApiDocs from './pages/ApiDocs.jsx';
import { SocketProvider } from './SocketProvider.jsx';
import { HighlightProvider } from './highlightContext.js';

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  {
    path: '/docs',
    element: <DocsPage />,
    children: [{ path: ':apiId', element: <ApiDocs /> }],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HighlightProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </HighlightProvider>
  </React.StrictMode>
);
