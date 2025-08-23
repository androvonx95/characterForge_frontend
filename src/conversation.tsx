import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import Paginator from './Paginator';
import { sendAiMessage } from './aiChat';
import type { Message } from './types';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';

interface ConversationProps {
  conversationId: string;
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
  initialUserMessage?: string; // ✅ optional first message
}

export default function Conversation({ conversationId, onNavigate, initialUserMessage }: ConversationProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [botInfo, setBotInfo] = useState<any>(null); // State to store bot details

  const fetchBotDetails = async () => {
    const botData = await getBotAndLastMessage(conversationId);
    setBotInfo(botData?.result[0]); // Assuming bot info is in result[0]
  };

  useEffect(() => {
    fetchBotDetails();
  }, [conversationId]);

  useEffect(() => {
    if (initialUserMessage) {
      sendMessage(initialUserMessage);
    }
  }, [initialUserMessage]);

  async function sendMessage(messageContent: string) {
    if (!messageContent.trim()) return;

    const userMessage: Message = { role: 'user', content: messageContent.trim() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const token = data.session.access_token;

      const res = await sendAiMessage(conversationId, userMessage.content, token);

      if (res.success && res.message) {
        const aiMessage: Message = { role: 'character', content: res.message };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(res.error || 'Something went wrong');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    sendMessage(input);
    setInput('');
  }

  return (
    <div>
      {/* Bot Info Section (Only Name and Description) */}
      {botInfo && (
        <div style={botInfoContainerStyle}>
          <h2 style={botNameStyle}>{botInfo.bot_name}</h2>
          <p style={botDescriptionStyle}>{botInfo.bot_prompt.description}</p>
        </div>
      )}

      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <Paginator 
          conversationId={conversationId} 
          messages={messages} 
          setMessages={setMessages} 
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{ width: '70%' }}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => onNavigate('my-chats', conversationId)}>Back</button>
    </div>
  );
}

// Styles for bot info
const botInfoContainerStyle: React.CSSProperties = {
  marginBottom: '20px',
  padding: '10px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  border: '1px solid #ddd',
};

const botNameStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '5px',
};

const botDescriptionStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#555',
  marginBottom: '10px',
};
