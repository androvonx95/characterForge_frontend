import { useState } from 'react';
import supabase from './supabaseClient';
import Paginator from './Paginator';
import { sendAiMessage } from './aiChat';
import type { Message } from './types'; // 👈 shared type
 // 👈 shared type

export default function Conversation({
  conversationId,
  onNavigate
}: { 
  conversationId: string; 
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void 
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // 👈 shared

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const token = data.session.access_token;

      const res = await sendAiMessage(conversationId, userMessage.content, token);

      if (res.success && res.message) {
        const aiMessage: Message = { role: 'character', content: res.message };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(res.error || 'Something went wrong');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Conversation</h1>

      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <Paginator 
          conversationId={conversationId} 
          messages={messages} 
          setMessages={setMessages} 
        />
      </div>


      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
          style={{ width: '70%' }}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => onNavigate('my-chats', conversationId)}>Back</button>
    </div>
  );
}
