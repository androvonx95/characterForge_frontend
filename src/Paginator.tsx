import { useEffect, useRef, useState } from 'react';
import supabase from './supabaseClient';
import { type Message } from './types'; 
import { deleteMessages } from './deleteMsgs';

export default function Paginator({
  conversationId,
  messages,
  setMessages,
}: {
  conversationId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingIdx, setStartingIdx] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [instruction, setInstruction] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  // DELETE MESSAGE
  const handleDelete = async (idx: number, role: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message and everything below?"
    );
    if (!confirmed) return;
  
    setDeletingIds((prev) => new Set(prev).add(idx));
  
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("Not authenticated");
        setDeletingIds((prev) => {
          const copy = new Set(prev);
          copy.delete(idx);
          return copy;
        });
        return;
      }
  
      const token = data.session.access_token;
      const result = await deleteMessages(conversationId, idx, token);
  
      if (result.success) {
        setMessages((prev) => {
          if (role === "user") {
            return prev.filter((m) => (m.idx ?? 0) < idx);
          } else {
            const userIdx = [...prev]
              .reverse()
              .find((m) => m.role === "user" && (m.idx ?? 0) < idx)?.idx;
            return prev.filter((m) => (m.idx ?? 0) < (userIdx ?? idx));
          }
        });
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting");
    } finally {
      setDeletingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(idx);
        return copy;
      });
    }
  };

  // REGENERATE LAST MESSAGE
  const handleRegenerate = async (instr = "") => {
    try {
      setIsRegenerating(true);

      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");

      const token = data.session.access_token;
      const res = await fetch(import.meta.env.VITE_REGENERATE_LAST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId, regenerationInstruction: instr }),
      });

      const result = await res.json();

      if (result.success) {
        setMessages((prev) => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === "character") {
              updated[i] = { ...updated[i], content: result.message };
              break;
            }
          }
          return updated;
        });
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while regenerating");
    } finally {
      setIsRegenerating(false);
      setShowModal(false);
      setInstruction("");
    }
  };

  // FETCH MESSAGES
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Not Authenticated");
        return;
      }

      const token = data.session.access_token;
      const response = await fetch(import.meta.env.VITE_PAGINATOR, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          startingIdx: startingIdx ?? 999999,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch messages");

      const result = await response.json();

      if (result.success) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = result.messages.filter((m: Message) => !existingIds.has(m.id));
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

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
  
    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loading) {
        const oldScrollHeight = container.scrollHeight;
        const currentScrollTop = container.scrollTop;
  
        fetchMessages().then(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDifference = newScrollHeight - oldScrollHeight;
          container.scrollTop = currentScrollTop + scrollDifference;
        });
      }
    };
  
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, startingIdx]);

  useEffect(() => {
    fetchMessages().then(() => {
      const container = containerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    });
  }, []);

  return (
    <>
      <div ref={containerRef} className="chat-container">
        {loading && messages.length === 0 && (
          <div className="loading-indicator">
            <span>Loading messages...</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">Error: {error}</div>}

        {messages.map((msg, i) => (
          <div
            key={msg.id ?? i}
            className={`message-wrapper ${msg.role}`}
          >
            <div className={`message-bubble ${msg.role}`}>
              {msg.content}
              
              {/* Message actions - show on hover */}
              <div className="message-actions">
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(msg.idx!, msg.role)}
                  disabled={deletingIds.has(msg.idx!)}
                  title="Delete message"
                >
                  {deletingIds.has(msg.idx!) ? "Deleting..." : "Delete"}
                </button>

                {/* Show regenerate options only for last character message */}
                {i === messages.length - 1 && msg.role === "character" && (
                  <>
                    <button
                      onClick={() => handleRegenerate()}
                      disabled={isRegenerating}
                      className="action-btn regenerate"
                      title="Regenerate message"
                    >
                      {isRegenerating ? "Regenerating..." : "Regenerate"}
                    </button>

                    <button
                      onClick={() => setShowModal(true)}
                      className="action-btn"
                      title="Regenerate with custom instruction"
                    >
                      Custom
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && messages.length > 0 && (
          <div className="loading-indicator">
            <span>Loading more messages...</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}
      </div>

      {/* Regeneration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Regenerate with Instruction</h3>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Enter your instruction for regeneration..."
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button 
                onClick={() => setShowModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRegenerate(instruction)}
                disabled={isRegenerating}
                className="modal-btn primary"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}