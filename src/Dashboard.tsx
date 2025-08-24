import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { createCharacter } from './createCharacter';
import LazyBotIntro from './useLazyMessages';
import Conversation from './conversation';
import './styles/Dashboard.css';
import './styles/global.css';

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void }) {
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

  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
        // console.log(publicChars);
        console.log(myChars);
      } catch (err) {
        setError((err as any).message || 'Failed to fetch characters');
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

  if (activeConversationId) {
    return (
      <Conversation
        conversationId={activeConversationId}
        onNavigate={(page) => {
          setActiveConversationId(null);
          onNavigate(page);
        }}
      />
    );
  }

  if (activeBotId && token) {
    return (
      <LazyBotIntro
        characterId={activeBotId}
        onStartConversation={(convId) => {
          setActiveConversationId(convId);
          setActiveBotId(null);
          onNavigate('conversation', convId);
        }}
        authToken={token}
        onNavigate={(page, conversationId) => {
          setActiveBotId(null);
          setActiveConversationId(conversationId ?? null);
          onNavigate(page, conversationId);
        }}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-heading">🎮 Character Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="dashboard-error">{error}</p>}

      <section className="dashboard-section">
        <div className="section-header">
          <h2>My Characters</h2>
          <button className="primary-button my-chats-button" onClick={() => onNavigate('my-chats')}>
            💬 My Chats
          </button>
          <button className="primary-button" onClick={() => setShowModal(true)}>+ Create Bot</button>
        </div>


        <div className="character-card-grid">
          {myCharacters.map((char) => {
            let description = "";
            let startingMessage = "";

            if (typeof char.prompt === "string") {
              try {
                // Try parsing prompt as JSON
                const parsed = JSON.parse(char.prompt);
                description = parsed.description || "";
                startingMessage = parsed.startingMessage || "";
              } catch {
                // If parsing fails, treat prompt as plain string
                description = "";
                startingMessage = char.prompt;
              }
            }

            return (
              <div
                key={char.id}
                className="character-card"
                onClick={() => setActiveBotId(char.id.toString())}
              >
                <div className="character-card-header">
                  <h3>{char.name}</h3>
                  <span className={`visibility-badge ${char.private ? "private" : "public"}`}>
                    {char.private ? "Private" : "Public"}
                  </span>
                </div>
                {description && <p className="character-description">{description}</p>}
                {startingMessage && (
                  <p className="character-snippet">{startingMessage.slice(0, 100)}...</p>
                )}
                {char.createdAt && (
                  <p className="character-date">
                    Created: {new Date(char.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>


      </section>
      {publicCharacters.length > 0 && (
  <section className="dashboard-section">
    <h2>All Characters</h2>
    <div className="character-card-grid">
      {publicCharacters.map((char) => {
        let description = "";
        let startingMessage = "";

        if (typeof char.prompt === "string") {
          try {
            const parsed = JSON.parse(char.prompt);
            description = parsed.description || "";
            startingMessage = parsed.startingMessage || "";
          } catch {
            description = "";
            startingMessage = char.prompt;
          }
        }

        return (
          <div
            key={char.id}
            className="character-card"
            onClick={() => setActiveBotId(char.id.toString())}
          >
            <div className="character-card-header">
              <h3>{char.name}</h3>
              <span className="visibility-badge public">Public</span>
            </div>
            {description && <p className="character-description">{description}</p>}
            {startingMessage && (
              <p className="character-snippet">{startingMessage.slice(0, 100)}...</p>
            )}
            {char.createdAt && (
              <p className="character-date">
                Created: {new Date(char.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      })}
    </div>
  </section>
)}





      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create a New Character</h3>
            <input className="modal-input" placeholder="Character Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <textarea className="modal-textarea" placeholder="Character Description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            <textarea className="modal-textarea" placeholder="Starting Message" value={newStartingMessage} onChange={(e) => setNewStartingMessage(e.target.value)} />
            <label className="checkbox-label">
              <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(p => !p)} />
              {' '}Private
            </label>
            <div className="modal-actions">
              <button className="primary-button" disabled={creating} onClick={handleCreateCharacter}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
