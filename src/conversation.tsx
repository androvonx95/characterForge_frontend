import { useState, useEffect, useRef } from 'react';
import supabase from './supabaseClient';
import Paginator from './Paginator';
import { sendAiMessage } from './aiChat';
import type { Message } from './types';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';
import './styles/chatUI.css';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchBotDetails = async () => {
    const botData = await getBotAndLastMessage(conversationId);
    setBotInfo(botData?.result[0]);
  };
  let imageUrl = 'https://imgs.search.brave.com/pnuCjus6wNu_B0lj4soEUb4KKx9_pn-HorGYVHwBMwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTIyMjUvMTIy/MjU4ODEucG5n';
  try{
    const botPrompt = JSON.parse(botInfo?.bot_prompt || '{}');
    imageUrl = botPrompt?.imageUrl || '/fallback.png'; // Default to fallback if no imageUrl is found
    
  }catch(err){
    console.log("Profile url not found");
    console.log(err);
  }
  console.log(imageUrl);

  useEffect(() => {
    fetchBotDetails();
  }, [conversationId]);

  useEffect(() => {
    if (initialUserMessage) {
      sendMessage(initialUserMessage);
    }
  }, [initialUserMessage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get bot initials for avatar
  const getBotInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  return (
    <div className="chat-wrapper">
      {/* Header with bot info */}
      <div className="chat-header">
      <div className="bot-avatar">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={botInfo?.bot_name || 'Bot'}
            className="bot-avatar-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://imgs.search.brave.com/pnuCjus6wNu_B0lj4soEUb4KKx9_pn-HorGYVHwBMwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTIyMjUvMTIy/MjU4ODEucG5n'; // Optional fallback
            }}
          />
        ) : (
          getBotInitials(botInfo?.bot_name || '')
        )}
      </div>

        <div className="bot-info">
          <h1 className="bot-name">{botInfo?.bot_name || 'Loading...'}</h1>
          <p className="bot-description">
            {botInfo?.bot_prompt?.description || 'Chat with your AI assistant'}
          </p>
        </div>
        <button 
          onClick={() => onNavigate('my-chats')} 
          className="back-btn-header"
        >
          ← Back
        </button>
      </div>

      {/* Messages Container */}
      <Paginator 
        conversationId={conversationId} 
        messages={messages} 
        setMessages={setMessages}
        messagesEndRef={messagesEndRef}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="loading-indicator">
          <span>AI is thinking</span>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Input Container */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading}
          className="message-input"
          rows={1}
          style={{
            height: 'auto',
            minHeight: '48px',
            maxHeight: '120px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()} 
          className="send-btn"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}