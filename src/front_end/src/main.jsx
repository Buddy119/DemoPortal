import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import DocsPage from './pages/DocsPage.jsx';
import ApiDocs from './pages/ApiDocs.jsx';
import ApiList from './components/ApiList.jsx';
import { SocketProvider } from './SocketProvider.jsx';
import { HighlightProvider } from './highlightContext.js';

function RootRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/docs" element={<DocsPage />}>
        <Route index element={<ApiList />} />
        <Route path=":apiId" element={<ApiDocs />} />
      </Route>
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HighlightProvider>
      <SocketProvider>
        <BrowserRouter>
          <RootRoutes />
        </BrowserRouter>
      </SocketProvider>
    </HighlightProvider>
  </React.StrictMode>
);
