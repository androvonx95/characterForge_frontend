import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { createCharacter } from './createCharacter';
import LazyBotIntro from './useLazyMessages';
import Conversation from './conversation'; // 👈 make sure this import exists

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats') => void }) {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [publicCharacters, setPublicCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStartingMessage, setNewStartingMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);

  // Lazy bot state
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ✅ conversation state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError('You are not authenticated');
          setLoading(false);
          return;
        }

        const t = data.session.access_token;
        if (!t) {
          setError('No token found');
          setLoading(false);
          return;
        }

        setToken(t);

        const myResponse = await fetch(import.meta.env.VITE_MY_CHARACTERS, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const myChars = await myResponse.json();
        setMyCharacters(myChars);

        const publicResponse = await fetch(import.meta.env.VITE_GET_PUBLIC_CHARS_EDGE_FUNC, {
          headers: { Authorization: `Bearer ${t}` },
        });
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

  const handleCreateCharacter = async () => {
    if (!newName.trim() || !newDescription.trim() || !newStartingMessage.trim()) return;

    setCreating(true);
    try {
      const promptObj = {
        description: newDescription,
        startingMessage: newStartingMessage,
      };

      const result = await createCharacter({
        name: newName,
        prompt: JSON.stringify(promptObj),
        private: isPrivate,
      });

      setMyCharacters((prev) => [
        ...prev,
        { id: result.id || Date.now(), name: newName, private: isPrivate },
      ]);

      setNewName('');
      setNewDescription('');
      setNewStartingMessage('');
      setIsPrivate(true);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to create character");
    } finally {
      setCreating(false);
    }
  };

  // ✅ if conversation is active, render Conversation.tsx directly
  if (activeConversationId) {
    return (
      <Conversation
        conversationId={activeConversationId}
        onNavigate={(page) => {
          if (page === 'my-chats') {
            setActiveConversationId(null);
            onNavigate('my-chats');
          } else {
            setActiveConversationId(null);
            onNavigate('dashboard');
          }
        }}
      />
    );
  }

  // ✅ if bot is selected, show LazyBotIntro
  if (activeBotId && token) {
    return (
      <LazyBotIntro
        characterId={activeBotId}
        onStartConversation={(convId) => {
          setActiveConversationId(convId); // 👈 go straight into conversation
          setActiveBotId(null);
        }}
        authToken={token}
      />
    );
  }

  // Default dashboard view
  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* My Characters */}
      <div style={{ marginBottom: '20px' }}>
        <h2>
          My Characters <button onClick={() => setShowModal(true)}>Create Bot</button>
        </h2>
        {myCharacters.length > 0 && (
          <ul>
            {myCharacters.map((char) => (
              <li key={char.id}>
                <button onClick={() => setActiveBotId(char.id.toString())}>
                  {char.name} {char.private ? "(Private)" : "(Public)"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Public Characters */}
      {publicCharacters.length > 0 && (
        <div>
          <h2>All Characters</h2>
          <ul>
            {publicCharacters.map((char) => (
              <li key={char.id}>
                <button onClick={() => setActiveBotId(char.id.toString())}>
                  {char.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button style={{ marginTop: '20px' }} onClick={() => onNavigate('my-chats')}>
        My Chats
      </button>

      {/* Modal for creating bot */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", width: "450px", maxWidth: "90%" }}>
            <h3>Create a New Character</h3>
            <input type="text" placeholder="Character name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ display: "block", marginBottom: "15px", width: "100%", padding: "10px", fontSize: "16px" }} />
            <textarea placeholder="Character description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ display: "block", marginBottom: "15px", width: "100%", height: "120px", padding: "10px", fontSize: "16px", resize: "none", boxSizing: "border-box" }} />
            <textarea placeholder="Starting message" value={newStartingMessage} onChange={(e) => setNewStartingMessage(e.target.value)} style={{ display: "block", marginBottom: "15px", width: "100%", height: "120px", padding: "10px", fontSize: "16px", resize: "none", boxSizing: "border-box" }} />
            <label style={{ display: "block", marginBottom: "15px" }}>
              <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate((p) => !p)} /> Private
            </label>
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCreateCharacter} disabled={creating || !newName.trim() || !newDescription.trim() || !newStartingMessage.trim()} style={{ padding: "10px 20px", fontSize: "16px", cursor: creating ? "not-allowed" : "pointer" }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button style={{ marginLeft: "15px", padding: "10px 20px", fontSize: "16px" }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
