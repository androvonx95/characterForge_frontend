import { useState, useEffect, useRef } from 'react';
import { getCharacterById, type Character } from './getCharacterInfo';
import { sendAiMessage } from './aiChat';
import './styles/chatUI.css';
import type { Message } from './types';

interface LazyBotIntroProps {
  characterId: string;
  authToken: string; // Supabase JWT
  onStartConversation: (conversationId: string, initialMessage: string) => void;
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
}

interface CharacterPrompt {
  description: string;
  startingMessage: string;
  imageUrl?: string;
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
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  let imageUrl = 'https://imgs.search.brave.com/pnuCjus6wNu_B0lj4soEUb4KKx9_pn-HorGYVHwBMwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTIyMjUvMTIy/MjU4ODEucG5n';

  useEffect(() => {
    const fetchCharacter = async () => {
      setLoading(true);
      try {
        const result = await getCharacterById(characterId);
        if (!result) {
          setError('Failed to load character');
        } else {
          setCharacter(result);
          try {
            const parsed: CharacterPrompt = result.prompt
              ? JSON.parse(result.prompt)
              : { description: '', startingMessage: '' };
            setPromptData(parsed);
            imageUrl = parsed.imageUrl || imageUrl;
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = async () => {
    if (!character) return;

    const trimmedMessage = input.trim();
    if (!trimmedMessage && !promptData?.startingMessage) return;

    setIsSending(true);
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
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get bot initials for avatar
  const getBotInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="chat-wrapper">
        <div className="loading-indicator">
          <span>Loading character...</span>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-wrapper">
        <div className="error-message">{error}</div>
        <button onClick={() => onNavigate('dashboard')} className="back-btn-header">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!character || !promptData) return null;

  return (
    <div className="chat-wrapper">
      {/* Header with bot info */}
      <div className="chat-header">
        <div className="bot-avatar">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={character.name || 'Bot'}
              className="bot-avatar-image"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://imgs.search.brave.com/pnuCjus6wNu_B0lj4soEUb4KKx9_pn-HorGYVHwBMwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTIyMjUvMTIy/MjU4ODEucG5n';
              }}
            />
          ) : (
            getBotInitials(character.name || '')
          )}
        </div>

        <div className="bot-info">
          <h1 className="bot-name">{character.name || 'Loading...'}</h1>
          <p className="bot-description">
            {promptData.description || 'Chat with your AI assistant'}
          </p>
        </div>
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="back-btn-header"
        >
          ← Back
        </button>
      </div>

      {/* Messages Container */}
      <div className="chat-container">
        {/* Intro message from character */}
        <div className="message-wrapper character">
          <div className="message-bubble character">
            {promptData.startingMessage}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && <div className="error-message">{error}</div>}

      {/* Input Container */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isSending}
          className="message-input"
          rows={1}
          style={{
            height: 'auto',
            minHeight: '48px',
            maxHeight: '120px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button 
          onClick={handleSend} 
          disabled={isSending || (!input.trim() && !promptData.startingMessage)} 
          className="send-btn"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
