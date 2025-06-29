import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import { Outlet } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow.jsx';

const DocsPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <Outlet />
        </main>
        <ChatWindow />
      </div>
    </div>
  );
};

export default DocsPage;
