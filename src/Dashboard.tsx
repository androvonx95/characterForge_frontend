import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats') => void }) {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const getCharacters = async () => {
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

        const response = await fetch(import.meta.env.VITE_GET_PUBLIC_CHARS_EDGE_FUNC, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setError('Failed to fetch characters');
          setLoading(false);
          return;
        }

        const chars = await response.json();
        setCharacters(chars);
      } catch (err) {
        setError((err as any).message || 'Failed to fetch characters: Unknown error');
      } finally {
        setLoading(false);
      }
    };

    getCharacters();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {characters.length > 0 && (
        <ul>
          {characters.map((character: any) => (
            <li key={character.id}>{character.name}</li>
          ))}
        </ul>
      )}
      <button onClick={() => onNavigate('my-chats')}>My Chats</button>
    </div>
  );
}
