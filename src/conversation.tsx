import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import Paginator from './Paginator';
import { sendAiMessage } from './aiChat';
import type { Message } from './types';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';
import './styles/chatUI.css'; // Import the CSS

interface ConversationProps {
  conversationId: string;
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
  initialUserMessage?: string;
}

export default function Conversation({ conversationId, onNavigate, initialUserMessage }: ConversationProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [botInfo, setBotInfo] = useState<any>(null);

  const fetchBotDetails = async () => {
    const botData = await getBotAndLastMessage(conversationId);
    setBotInfo(botData?.result[0]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Bot Info Header */}
      {botInfo && (
        <div className="bot-info-header">
          <h2 className="bot-name">{botInfo.bot_name}</h2>
          <p className="bot-description">{botInfo.bot_prompt.description}</p>
        </div>
      )}

      {/* Messages Container */}
      <Paginator 
        conversationId={conversationId} 
        messages={messages} 
        setMessages={setMessages} 
      />

      {/* Input Container */}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          className="message-input"
        />
        <button onClick={handleSend} disabled={loading} className="send-btn">
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <button onClick={() => onNavigate('my-chats', conversationId)} className="back-btn">
        ← Back to Chats
      </button>
    </div>
  );
}