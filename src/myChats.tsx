import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import Paginator from './Paginator.tsx';  


export default function MyChats({
  onNavigate,
}: { 
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
})

{
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const getChats = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError('You are not authenticated');
          setLoading(false);
          return;
        }

        const token = data.session.access_token;
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }

        const response = await fetch(import.meta.env.VITE_GET_USER_CONVERSATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setError('Failed to fetch chats');
          setLoading(false);
          return;
        }

        const result = await response.json();
        setChats(result.conversations || []);
        console.log(result);
      } catch (err) {
        setError((err as any).message || 'Failed to fetch chats: Unknown error');
      } finally {
        setLoading(false);
      }
    };

    getChats();
  }, []);

  return (
    <div>
      <h1>My Chats</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {chats.length > 0 ? (
        <ul>
          {chats.map((chat: any) => (
            <li key={chat.id}>
              <button
                onClick={() => {
                  onNavigate('conversation', chat.id )
                  console.log("Clicked conversation:", chat.id);
                  // later we can navigate to Conversation.tsx page
                }}
                style={{
                  padding: "8px 12px",
                  margin: "4px 0",
                  cursor: "pointer",
                }}
              >
                {chat.id} {/* you can replace this with chat title later */}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No chats yet.</p>
      )}
      <button onClick={() => onNavigate('dashboard')}>Dashboard</button>
    </div>
  );
}
