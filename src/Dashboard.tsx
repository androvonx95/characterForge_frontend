import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats') => void }) {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [publicCharacters, setPublicCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch user's private characters
        const myResponse = await fetch(import.meta.env.VITE_MY_CHARACTERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!myResponse.ok) {
          setError('Failed to fetch your characters');
          setLoading(false);
          return;
        }
        const myChars = await myResponse.json();
        setMyCharacters(myChars);
        console.log(myChars);

        // Fetch all public characters
        const publicResponse = await fetch(import.meta.env.VITE_GET_PUBLIC_CHARS_EDGE_FUNC, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!publicResponse.ok) {
          setError('Failed to fetch public characters');
          setLoading(false);
          return;
        }
        const publicChars = await publicResponse.json();
        setPublicCharacters(publicChars);
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
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* My Characters Section */}
      {myCharacters.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h2>My Characters</h2>
          <ul>
            {myCharacters.map((character) => (
              <li key={character.id}>
                {character.name}  
                {character.private ? "(Private)" : "(Public)"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Public Characters Section */}
      {publicCharacters.length > 0 && (
        <div>
          <h2>All Characters</h2>
          <ul>
            {publicCharacters.map((character) => (
              <li key={character.id}>
                {character.name}  
              </li>
            ))}
          </ul>
        </div>
      )}

      <button style={{ marginTop: '20px' }} onClick={() => onNavigate('my-chats')}>
        My Chats
      </button>
    </div>
  );
}
