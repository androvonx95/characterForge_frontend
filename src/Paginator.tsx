import { useEffect, useRef, useState } from 'react';
import supabase from './supabaseClient';
import { type Message } from './types'; 
import { deleteMessages } from './deleteMsgs';

export default function Paginator({
  conversationId,
  messages,
  setMessages,
  messagesEndRef,
}: {
  conversationId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingIdx, setStartingIdx] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [instruction, setInstruction] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const isFetchingOlderRef = useRef(false);

  // Utility to detect whether the user is near the bottom
  const isNearBottom = () => {
    const container = containerRef.current;
    if (!container) return false;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Smoothly scroll to bottom
  const scrollToBottom = (smooth = true) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const handleDelete = async (idx: number, role: string) => {
    if (!window.confirm("Are you sure you want to delete this message and everything below?")) {
      return;
    }
    setDeletingIds(prev => new Set(prev).add(idx));
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");
      const token = data.session.access_token;
      const result = await deleteMessages(conversationId, idx, token);
      if (result.success) {
        setMessages(prev => {
          if (role === "user") {
            return prev.filter(m => (m.idx ?? 0) < idx);
          } else {
            const userIdx = [...prev]
              .reverse()
              .find(m => m.role === "user" && (m.idx ?? 0) < idx)?.idx;
            return prev.filter(m => (m.idx ?? 0) < (userIdx ?? idx));
          }
        });
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting");
    } finally {
      setDeletingIds(prev => {
        const copy = new Set(prev);
        copy.delete(idx);
        return copy;
      });
    }
  };

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
        setMessages(prev => {
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

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");
      const token = data.session.access_token;
      const res = await fetch(import.meta.env.VITE_PAGINATOR, {
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
      if (!res.ok) throw new Error("Failed to fetch messages");
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Error fetching");
      return result;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch older messages and maintain scroll position
  const fetchOlderMessages = async () => {
    const container = containerRef.current;
    if (!container || isFetchingOlderRef.current) return;

    isFetchingOlderRef.current = true;
    const prevScrollHeight = container.scrollHeight;

    const result = await fetchMessages();
    if (result) {
      setMessages(prev => {
        const existing = new Set(prev.map(m => m.id));
        const newOnes = result.messages.filter((m: Message) => !existing.has(m.id));
        return [...newOnes, ...prev];
      });
      if (result.messages.length > 0) {
        setStartingIdx(result.messages[0].idx ?? startingIdx);
      }
      setHasMore(result.hasMore);
    }

    // Wait for next layout to preserve scroll position
    await new Promise(requestAnimationFrame);
    const newScrollHeight = container.scrollHeight;
    container.scrollTop = newScrollHeight - prevScrollHeight;

    isFetchingOlderRef.current = false;
  };

  // On scroll: trigger older message fetch if at top
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      if (container.scrollTop <= 0 && hasMore && !loading && !isFetchingOlderRef.current) {
        fetchOlderMessages();
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, loading]);

  // Auto-scroll when user appends a new message at bottom
  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const curr = messages.length;
    if (curr > prev && !isFetchingOlderRef.current && isNearBottom()) {
      scrollToBottom(true);
    }
    prevMessageCountRef.current = curr;
  }, [messages]);

  // Initial load
  useEffect(() => {
    (async () => {
      const result = await fetchMessages();
      if (result) {
        setMessages([...result.messages]);
        if (result.messages.length > 0) {
          setStartingIdx(result.messages[0].idx ?? null);
        }
        setHasMore(result.hasMore);
        scrollToBottom(false);
      }
    })();
  }, [conversationId]);

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
          <div key={msg.id ?? i} className={`message-wrapper ${msg.role}`}>
            <div className={`message-bubble ${msg.role}`}>
              {msg.content}
              <div className="message-actions">
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(msg.idx!, msg.role)}
                  disabled={deletingIds.has(msg.idx!)}
                  title="Delete message"
                >
                  {deletingIds.has(msg.idx!) ? "Deleting..." : "Delete"}
                </button>

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

        {messagesEndRef && <div ref={messagesEndRef} />}

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
              <button onClick={() => setShowModal(false)} className="modal-btn cancel">
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
