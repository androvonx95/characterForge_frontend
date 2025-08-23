import { useState, useEffect, useRef } from 'react';
import supabase from './supabaseClient';
import { getCharacterById, type Character } from './getCharacterInfo';
import { sendAiMessage } from './aiChat';

interface LazyBotIntroProps {
  characterId: string;
  authToken: string; // Supabase JWT
  onStartConversation: (conversationId: string, initialMessage: string) => void;
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
}

interface CharacterPrompt {
  description: string;
  startingMessage: string;
}

export default function LazyBotIntro({
  characterId,
  authToken,
  onStartConversation,
  onNavigate,
}: LazyBotIntroProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [promptData, setPromptData] = useState<CharacterPrompt | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const result = await getCharacterById(characterId);
        const char = result?.character;
        if (!char) {
          setError('Failed to load character');
        } else {
          setCharacter(char);
          try {
            const parsed: CharacterPrompt = char.prompt
              ? JSON.parse(char.prompt)
              : { description: '', startingMessage: '' };
            setPromptData(parsed);
          } catch (err) {
            console.error('Failed to parse prompt JSON', err);
            setPromptData({ description: '', startingMessage: '' });
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    };
    fetchCharacter();
  }, [characterId]);

  const handleSend = async () => {
    if (!character) return;

    const trimmedMessage = input.trim();
    if (!trimmedMessage && !promptData?.startingMessage) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Create a new conversation
      const res = await fetch(import.meta.env.VITE_NEW_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bot_id: character.id }),
      });

      if (!res.ok) {
        let errMsg = 'Failed to create conversation';
        try {
          const txt = await res.text();
          errMsg = (txt && JSON.parse(txt)?.error) || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const conversationId: string = data.conversationId;

      // 2. Send messages (starting + user input)
      if (promptData?.startingMessage) {
        await sendAiMessage(conversationId, promptData.startingMessage, authToken);
      }
      if (trimmedMessage) {
        await sendAiMessage(conversationId, trimmedMessage, authToken);
      }

      // 3. Navigate into conversation
      onStartConversation(conversationId, '');

      // Reset input
      setInput('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading bot...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!character) return null;

  // Shared styles
  const botInfoContainerStyle: React.CSSProperties = {
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #ddd',
  };

  const botNameStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '5px',
  };

  const botDescriptionStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: '#555',
    marginBottom: '10px',
  };

  const startingMessageStyle: React.CSSProperties = {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: '10px',
  };

  return (
    <div>
      {/* Bot Info Section */}
      <div style={botInfoContainerStyle}>
        <h2 style={botNameStyle}>{character.name || 'Unknown Bot'}</h2>
        {/* {promptData?.description && (
          <p style={botDescriptionStyle}>{promptData.description}</p>
        )}
        {promptData?.startingMessage && (
          <p style={startingMessageStyle}>{promptData.startingMessage}</p>
        )} */}
      </div>

      {/* Messages Section */}
      <div
        style={{ height: "400px", overflowY: "auto", border: "1px solid gray", padding: "8px" }}
        ref={containerRef}
      >
          <div>
            <strong>AI:</strong> {promptData?.startingMessage}
          </div>

      </div>
      {/* Input Section */}
      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{ width: '70%' }}
        />
        <button
          onClick={handleSend}
          disabled={loading || (!input.trim() && !promptData?.startingMessage)}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Back to dashboard */}
      <button onClick={() => onNavigate('dashboard')} style={{ marginTop: '10px' }}>
        Back
      </button>
    </div>
  );
}
