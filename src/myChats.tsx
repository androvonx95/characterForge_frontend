import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';
import './styles/MyChats.css'; // Import the CSS styles

interface ChatDetail {
  id: string;
  botName: string;
  lastMessage: string;
}

export default function MyChats({
  onNavigate,
}: {
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
}) {
  const [chats, setChats] = useState<ChatDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChats() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error('You are not authenticated');
        const token = data.session.access_token;
        if (!token) throw new Error('No token found');

        const response = await fetch(import.meta.env.VITE_GET_USER_CONVERSATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch chats');
        }

        const result = await response.json();
        const conversations = result.conversations || [];

        const detailedChats = await Promise.all(
          conversations.map(async (conv: { id: string }) => {
            try {
              const detail = await getBotAndLastMessage(conv.id);
              const botData = detail?.result?.[0];
              return {
                id: conv.id,
                botName: botData?.bot_name ?? 'Unknown Bot',
                lastMessage: botData?.last_message_content ?? 'No messages yet',
              };
            } catch {
              return {
                id: conv.id,
                botName: 'Unknown Bot',
                lastMessage: 'No messages yet',
              };
            }
          })
        );

        setChats(detailedChats);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();
  }, []);

  return (
    <div className="myChats-container">
      <button
        onClick={() => onNavigate('dashboard')}
        className="myChats-dashboardBtn"
        aria-label="Go to dashboard"
      >
        Dashboard
      </button>

      <h1 className="myChats-title">My Chats</h1>

      {loading && <p className="myChats-loading">Loading chats...</p>}
      {error && <p className="myChats-error">Error: {error}</p>}
      {!loading && !error && chats.length === 0 && <p className="myChats-noChats">No chats yet.</p>}

      <div className="myChats-list">
        {chats.map(({ id, botName, lastMessage }) => (
          <div
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate('conversation', id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate('conversation', id);
              }
            }}
            className="myChats-card"
            title={`Conversation with ${botName}`}
          >
            <div className="myChats-botName">{botName}</div>
            <div className="myChats-lastMessage" title={lastMessage}>
              {lastMessage || <i>No messages yet</i>}
            </div>
            <small className="myChats-conversationId">Conversation ID: {id}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
