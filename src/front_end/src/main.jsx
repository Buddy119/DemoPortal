import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import DocsPage from './pages/DocsPage.jsx';
import ApiDocs from './pages/ApiDocs.jsx';
import ApiList from './components/ApiList.jsx';
import ApiDetailsPage from './pages/ApiDetailsPage.jsx';
import SdksPage from './pages/SdksPage.jsx';
import ScenariosPage from './pages/ScenariosPage.jsx';
import ApiFilterPage from './pages/ApiFilterPage.jsx';
import { SocketProvider } from './SocketProvider.jsx';
import { HighlightProvider } from './highlightContext.jsx';

function RootRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/apis" element={<ApiFilterPage />} />
      <Route path="/sdks" element={<SdksPage />} />
      <Route path="/scenarios" element={<ScenariosPage />} />
      <Route path="/api/:slug" element={<ApiDetailsPage />} />
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
