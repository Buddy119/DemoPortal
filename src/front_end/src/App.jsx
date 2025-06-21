import ApiList from './components/ApiList';
import ChatWindow from './components/ChatWindow';

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <ApiList />
      <ChatWindow />
    </div>
  );
}
