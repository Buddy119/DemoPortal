import ApiList from '/src/components/ApiList.jsx';
import ChatWindow from '/src/components/ChatWindow.jsx';

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <ApiList />
      <ChatWindow />
    </div>
  );
}
