import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';

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

        // Fetch bot and last message details in parallel
        const detailedChats = await Promise.all(
          conversations.map(async (conv: { id: string }) => {
            try {
              const detail = await getBotAndLastMessage(conv.id);

              // Extracting the bot data from the result array (index 0)
              const botData = detail?.result?.[0];

              return {
                id: conv.id,
                botName: botData?.bot_name ?? 'Unknown Bot',
                lastMessage: botData?.last_message_content ?? 'No messages yet',
              };
            } catch {
              // Fallback if fetching details fails for a chat
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
    <div style={{ maxWidth: 800, margin: 'auto', padding: '1rem' }}>
      {/* Dashboard Button at Top Left */}
      <button
        onClick={() => onNavigate('dashboard')}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          padding: '10px 16px',
          borderRadius: 6,
          border: 'none',
          backgroundColor: '#007bff',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
        aria-label="Go to dashboard"
      >
        Dashboard
      </button>

      <h1 style={{ textAlign: 'center' }}>My Chats</h1>

      {loading && <p>Loading chats...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && chats.length === 0 && <p>No chats yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {chats.map(({ id, botName, lastMessage }) => (
          <li key={id} style={{ marginBottom: 12 }}>
            <button
              onClick={() => onNavigate('conversation', id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #ddd',
                cursor: 'pointer',
                backgroundColor: '#f9f9f9',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#eaeaea')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
              aria-label={`Open conversation with bot ${botName}`}
            >
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{botName}</div>
              <div style={{ color: '#555', marginTop: 4, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lastMessage || <i>No messages yet</i>}
              </div>
              <small style={{ color: '#999' }}>Conversation ID: {id}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
