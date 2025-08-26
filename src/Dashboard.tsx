import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { createCharacter } from './createCharacter';
import LazyBotIntro from './useLazyMessages';
import Conversation from './conversation';
import './styles/Dashboard.css';
import './styles/global.css';
import CharacterPreviewModal from './components/CharacterPreviewModal';

import { getSignedUploadUrl, uploadFileToS3 } from './getSignedUploadUrl';
import React from 'react';

export default function Dashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void }) {
  const DEFAULT_IMAGE_URL = "https://imgs.search.brave.com/SlAHcvHF1G6DX8aNn-45OSpTEyTI2Zy4Mr-DzvMrOyw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzk3LzM4/L2JkLzk3MzhiZGQy/NjU4YWY2MzczODdk/ZDUxNDRlM2FjNTI4/LmpwZw"
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

  // Add state for the image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);


  const [previewCharacter, setPreviewCharacter] = useState<null | {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  }>(null);


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
        // console.log(myChars);
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

      <button className="primary-button" onClick={() => onNavigate('my-chats')}>My Chats</button>
      <h1 className="dashboard-heading">🎮 Character Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="dashboard-error">{error}</p>}

      <section className="dashboard-section my-characters-section">
        <div className="section-header">
          <h2>My Characters</h2>
          <button className="primary-button my-chats-button" onClick={() => onNavigate('my-chats')}>
            💬 My Chats
          </button>
          <button className="primary-button" onClick={() => setShowModal(true)}>+ Create Bot</button>
        </div>

      {/* NEW: Horizontal bar layout for My Characters */}
      <div className="my-characters-bar">
        <span className="my-characters-label">YOUR BOTS</span>

        <div 
          className="create-bot-circle" 
          onClick={() => setShowModal(true)}
          title="Create Bot"
        ></div>

        {myCharacters.map((char) => {
          let imageUrl = DEFAULT_IMAGE_URL;

          if (typeof char.prompt === "string") {
            try {
              const parsed = JSON.parse(char.prompt);
              imageUrl = parsed.imageUrl || DEFAULT_IMAGE_URL;
            } catch {
              // Use default image
            }
          }

          return (
            <div key={char.id} className="my-character-avatar-wrapper">
              <img
                src={imageUrl}
                alt={char.name}
                className="my-character-avatar"
                title={char.name}
                onClick={() => {
                  let imageUrl = DEFAULT_IMAGE_URL;
                  let description = '';
                  console.log( char );
                  if (typeof char.prompt === "string") {
                    try {
                      const parsed = JSON.parse(char.prompt);
                      imageUrl = parsed.imageUrl || DEFAULT_IMAGE_URL;
                      description = parsed.description || '';
                    } catch {
                      // fallback
                    }
                  }

                  setPreviewCharacter({
                    id: char.id,
                    name: char.name,
                    description,
                    imageUrl,
                  });
                  console.log(char);
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
                }}
              />
              <span className="my-character-name" title={char.name}>
                {char.name}
              </span>
            </div>
          );
        })}

        {/* ✅ Modal rendered once, after the loop */}
        {previewCharacter && (
          <CharacterPreviewModal
            id={previewCharacter.id}
            name={previewCharacter.name}
            description={previewCharacter.description}
            imageUrl={previewCharacter.imageUrl}
            onClose={() => setPreviewCharacter(null)}
            onDelete={(id) => {
              setMyCharacters((prev) => prev.filter((char) => char.id !== id));
              setPreviewCharacter(null);
            }}
          />
        )}
      </div>


      </section>
      
      {publicCharacters.length > 0 && (
        <section className="dashboard-section">
          <h2>All Characters</h2>
          <div className="character-card-grid">
              {publicCharacters.map((char) => {
                  let description = "";
                  let startingMessage = "";
                  let imageUrl = DEFAULT_IMAGE_URL;

                  if (typeof char.prompt === "string") {
                    try {
                      const parsed = JSON.parse(char.prompt);
                      description = parsed.description || "";
                      startingMessage = parsed.startingMessage || "";
                      imageUrl = parsed.imageUrl || DEFAULT_IMAGE_URL;
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
                      {/* ✅ ADD IMAGE */}
                      <img
                        src={imageUrl}
                        alt={char.name}
                        className="character-image"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL }}
                      />

                      <div className="character-card-header">
                        <h3>{char.name}</h3>
                        <span className="visibility-badge public">Public</span>
                      </div>

                      {description && <p className="character-description">{description}</p>}
                      {/* {startingMessage && (
                        <p className="character-snippet">{startingMessage.slice(0, 100)}...</p>
                      )} */}
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
      <input
        className="modal-input"
        placeholder="Character Name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <textarea
        className="modal-textarea"
        placeholder="Character Description"
        value={newDescription}
        onChange={(e) => setNewDescription(e.target.value)}
      />
      <textarea
        className="modal-textarea"
        placeholder="Starting Message"
        value={newStartingMessage}
        onChange={(e) => setNewStartingMessage(e.target.value)}
      />

      {/* 👇 Image Upload */}
      <div style={{ marginTop: '1rem' }}>
        <label className="checkbox-label">Upload Character Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        {uploadingImage && <p>Uploading image...</p>}
        {imageUrl && <p style={{ fontSize: '0.9em' }}>✅ Uploaded</p>}
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={() => setIsPrivate((p) => !p)}
        />
        {' '}Private
      </label>

      <div className="modal-actions">
        <button
          className="primary-button"
          disabled={creating || uploadingImage}
          onClick={async () => {
            setCreating(true);
            try {
              let uploadedUrl: string | null = imageUrl;

              if (imageFile && !uploadedUrl) {
                setUploadingImage(true);
                const res = await getSignedUploadUrl(imageFile.name, imageFile.type);
                if (!res) throw new Error("Could not get signed upload URL");

                const success = await uploadFileToS3(res.signedUrl, imageFile);
                if (!success) throw new Error("Failed to upload image");

                uploadedUrl = res.fileUrl;
                setImageUrl(uploadedUrl);
              }

              const promptObj = {
                description: newDescription,
                startingMessage: newStartingMessage,
                imageUrl: uploadedUrl, // 👈 include uploaded image URL
              };
              console.log("Prompt Object:", promptObj);
              const result = await createCharacter({
                name: newName,
                prompt: JSON.stringify(promptObj),
                private: isPrivate,
              });

              setMyCharacters((prev) => [
                ...prev,
                {
                  id: result.id || Date.now(),
                  name: newName,
                  private: isPrivate,
                  prompt: JSON.stringify(promptObj),
                },
              ]);

              // If the character is public, also add it to public characters
              if (!isPrivate) {
                setPublicCharacters((prev) => [
                  {
                    id: result.id || Date.now(),
                    name: newName,
                    private: isPrivate,
                    prompt: JSON.stringify(promptObj),
                    createdAt: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }

              // Reset all
              setNewName('');
              setNewDescription('');
              setNewStartingMessage('');
              setImageFile(null);
              setImageUrl(null);
              setIsPrivate(true);
              setShowModal(false);
            } catch (err: any) {
              alert(err.message || "Failed to create character");
            } finally {
              setCreating(false);
              setUploadingImage(false);
            }
          }}
        >
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