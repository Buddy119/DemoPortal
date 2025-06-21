function MessageCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-message-circle"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function MinusIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-minus"
    >
      <path d="M5 12h14" />
    </svg>
  );
}
import { useSocket } from '/src/SocketProvider.jsx';
import { useElementHighlight } from '/src/hooks/useElementHighlight.js';

export default function ChatWindow() {
  const [open, setOpen] = React.useState(true);
  const [messages, setMessages] = React.useState([
    { sender: 'bot', text: 'Hello! How can we assist you?' },
  ]);
  const [input, setInput] = React.useState('');
  const { sendMessage, subscribeToResponses } = useSocket();
  const { highlight } = useElementHighlight();
  const messagesRef = React.useRef(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToResponses((data) => {
      setMessages((msgs) => [...msgs, { sender: 'bot', text: data.responseText }]);
      if (data.highlightSelector) {
        highlight(data.highlightSelector);
      }
    });
    return unsubscribe;
  }, [subscribeToResponses, highlight]);

  React.useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim()) return;
    const payload = {
      context: {
        currentPage: 'User Authentication API',
        selectedLanguage: 'curl',
        previousQueries: [],
      },
      userQuery: input,
    };
    sendMessage(payload);
    setMessages((msgs) => [...msgs, { sender: 'user', text: input }]);
    setInput('');
  };

  return (
    <>
      <div
        className={`fixed bottom-4 right-4 w-72 bg-white border rounded shadow-lg flex flex-col transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <div className="flex justify-between items-center border-b p-2">
          <span className="font-semibold">Chat</span>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => setOpen(false)}
          >
            <MinusIcon width={16} height={16} />
          </button>
        </div>
        <div ref={messagesRef} className="p-2 overflow-y-auto space-y-2 flex-1" style={{ maxHeight: '300px' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`text-sm rounded p-2 w-fit ${m.sender === 'bot' ? 'bg-gray-100' : 'bg-blue-100 self-end'}`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex items-center border-t p-2">
          <input
            className="flex-1 border rounded p-1 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button
            className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
      {!open && (
        <button
          className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
          onClick={() => setOpen(true)}
        >
          <MessageCircleIcon width={20} height={20} />
        </button>
      )}
    </>
  );
}
