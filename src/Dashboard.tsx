import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { createCharacter } from './createCharacter';

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats') => void }) {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [publicCharacters, setPublicCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modal + form state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);

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
        const myChars = await myResponse.json();
        setMyCharacters(myChars);

        // Fetch all public characters
        const publicResponse = await fetch(import.meta.env.VITE_GET_PUBLIC_CHARS_EDGE_FUNC, {
          headers: { Authorization: `Bearer ${token}` },
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
    if (!newName.trim() || !newPrompt.trim()) {
      return; // should never be hit now because button is disabled
    }

    setCreating(true);
    try {
      const result = await createCharacter({
        name: newName,
        prompt: newPrompt,
        private: isPrivate,
      });

      console.log("Created:", result);

      // update local list
      setMyCharacters((prev) => [
        ...prev,
        { id: Date.now(), name: newName, private: isPrivate },
      ]);

      // reset + close modal
      setNewName('');
      setNewPrompt('');
      setIsPrivate(true);
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to create character");
    } finally {
      setCreating(false);
    }
  };

  const isInvalid = !newName.trim() || !newPrompt.trim();

  return (
    <div>
      <h1>Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* My Characters Section */}
      <div style={{ marginBottom: '20px' }}>
        <h2>
          My Characters{" "}
          <button onClick={() => setShowModal(true)}>Create Bot</button>
        </h2>

        {myCharacters.length > 0 && (
          <ul>
            {myCharacters.map((character) => (
              <li key={character.id}>
                {character.name} {character.private ? "(Private)" : "(Public)"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Public Characters Section */}
      {publicCharacters.length > 0 && (
        <div>
          <h2>All Characters</h2>
          <ul>
            {publicCharacters.map((character) => (
              <li key={character.id}>{character.name}</li>
            ))}
          </ul>
        </div>
      )}

      <button style={{ marginTop: '20px' }} onClick={() => onNavigate('my-chats')}>
        My Chats
      </button>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "400px",
            maxWidth: "90%"
          }}>
            <h3>Create a New Character</h3>
            <input
              type="text"
              placeholder="Character name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ display: "block", marginBottom: "10px", width: "100%" }}
            />
            <textarea
              placeholder="Character prompt"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              style={{ display: "block", marginBottom: "10px", width: "100%" }}
            />
            <label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={() => setIsPrivate((p) => !p)}
              />{" "}
              Private
            </label>

            {/* Live validation message */}
            {isInvalid && (
              <p style={{ color: "red", fontSize: "0.85em", marginTop: "8px" }}>
                ⚠️ Please fill in all fields.
              </p>
            )}

            <div style={{ marginTop: "15px" }}>
              <button
                onClick={handleCreateCharacter}
                disabled={creating || isInvalid}
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button style={{ marginLeft: "10px" }} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
