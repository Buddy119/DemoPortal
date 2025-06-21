import App from '/src/App.jsx';
import { SocketProvider } from '/src/SocketProvider.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <SocketProvider>
    <App />
  </SocketProvider>
);
