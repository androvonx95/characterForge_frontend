import { useEffect, useRef, useState } from 'react';
import supabase from './supabaseClient';
import { type Message } from './types'; // 👈 shared type
import { deleteMessages } from './deleteMsgs';






export default function Paginator({
  conversationId,
  messages,
  setMessages
}: {
  conversationId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingIdx, setStartingIdx] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleDelete = async (idx: number, role: string) => {
    // Ask for confirmation first
    const confirmed = window.confirm("Are you sure you want to delete this message and everything below?");
    if (!confirmed) return;
  
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("Not authenticated");
        return;
      }
  
      const token = data.session.access_token;
      const result = await deleteMessages(conversationId, idx, token);
  
      if (result.success) {
        setMessages((prev) => {
          if (role === "user") {
            // 🔑 Delete user + everything below
            return prev.filter((m) => (m.idx ?? 0) < idx);
          } else {
            // 🔑 Find corresponding user message just above
            const userIdx = [...prev]
              .reverse()
              .find((m) => m.role === "user" && (m.idx ?? 0) < idx)?.idx;
  
            return prev.filter((m) => (m.idx ?? 0) < (userIdx ?? idx));
          }
        });
        console.log("Deletion successful!");
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting");
    }
  };
  
  

  const fetchMessages = async () => {
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Not Authenticated');
        return;
      }

      const token = data.session.access_token;

      const response = await fetch(import.meta.env.VITE_PAGINATOR, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          startingIdx: startingIdx ?? 999999,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const result = await response.json();

      if (result.success) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = result.messages.filter(
            (m: Message) => !existingIds.has(m.id)
          );
          return [...newOnes, ...prev];
        });

        if (result.messages.length > 0) {
          setStartingIdx(result.messages[0].idx ?? null);
        }

        setHasMore(result.hasMore);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll (up)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loading) {
        const oldScrollHeight = container.scrollHeight;
        fetchMessages().then(() => {
          container.scrollTop = container.scrollHeight - oldScrollHeight;
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, startingIdx]);

  // Initial load
  useEffect(() => {
    fetchMessages().then(() => {
      const container = containerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height: '400px',
        overflowY: 'auto',
        border: '1px solid gray',
        padding: '8px',
      }}
    >
  {messages.map((msg, i) => (
    <div key={msg.id ?? i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>{msg.role}:</strong> {msg.content}
      </div>
      <button 
        style={{ fontSize: '0.8rem', padding: '2px 6px', marginLeft: '8px' }}
        onClick={() => handleDelete(msg.idx!, msg.role)}
      >
      Delete
      </button>
    </div>
  ))}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
