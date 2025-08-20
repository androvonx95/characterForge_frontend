import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { getCharacterById, type Character } from './getCharacterInfo';
import { sendAiMessage } from './aiChat';

interface LazyBotIntroProps {
  characterId: string;
  onStartConversation: (conversationId: string, initialMessage: string) => void; // keep signature; we'll pass ''
  authToken: string; // Supabase JWT from caller
}

interface CharacterPrompt {
  description: string;
  startingMessage: string;
}

export default function LazyBotIntro({ characterId, onStartConversation, authToken }: LazyBotIntroProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [promptData, setPromptData] = useState<CharacterPrompt | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!trimmedMessage && !promptData?.startingMessage) {
      // nothing to send/seed
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Create conversation
      const res = await fetch(import.meta.env.VITE_NEW_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ bot_id: character.id }),
      });

      if (!res.ok) {
        // try to read any error body safely
        let errMsg = 'Failed to create conversation';
        try {
          const txt = await res.text();
          errMsg = (txt && JSON.parse(txt)?.error) || errMsg;
        } catch { /* ignore parse errors */ }
        throw new Error(errMsg);
      }

      const data = await res.json();
      const conversationId: string = data.conversationId;

      // 2) Seed bot starting message (role: character)
      // if (promptData?.startingMessage) {
      //   const { error: insertErr } = await supabase
      //     .from('messages')
      //     .insert([
      //       {
      //         conversation_id: conversationId,
      //         role: 'character',
      //         content: promptData.startingMessage,
      //       },
      //     ]);

      //   if (insertErr) {
      //     console.error('Failed to insert starting message:', insertErr);
      //     // Non-fatal: continue
      //   }
      // }

      // 3) If user typed something, use your existing sendAiMessage helper
      if (trimmedMessage) {
        try {
          await sendAiMessage(conversationId, promptData?.startingMessage, authToken);
          await sendAiMessage(conversationId, trimmedMessage, authToken);
          // sendAiMessage usually persists the user message + AI reply on the backend
        } catch (e) {
          console.error('sendAiMessage failed:', e);
          // Non-fatal: user will still enter the conversation and can retry
        }
      }

      // 4) Navigate into the conversation — do NOT pass an initial message,
      //     otherwise Conversation.tsx will immediately send it again.
      onStartConversation(conversationId, '');

      // reset input
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

  return (
    <div>
      <h2>Chat with {character.name || 'Unknown Bot'}</h2>

      {/* Show bot’s starting message up front */}
      {promptData?.startingMessage && (
        <p style={{ fontStyle: 'italic' }}>{promptData.startingMessage}</p>
      )}

      {/* Show description as profile info */}
      {promptData?.description && (
        <p style={{ color: 'gray', fontSize: '0.9em' }}>{promptData.description}</p>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        style={{ width: '70%' }}
        disabled={loading}
      />
      <button
        onClick={handleSend}
        disabled={loading || (!input.trim() && !promptData?.startingMessage)}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
