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

  // DELETE MESSAGE (same as before)
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
      setShowModal(false); // close modal after sending
      setInstruction("");
    }
  };

  // FETCH MESSAGES (same as before)
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

  // Infinite scroll (same as before)
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
    <div
      ref={containerRef}
      style={{ height: "400px", overflowY: "auto", border: "1px solid gray", padding: "8px" }}
    >
      {messages.map((msg, i) => (
        <div
          key={msg.id ?? i}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <strong>{msg.role}:</strong> {msg.content}
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            <button
              style={{ fontSize: "0.8rem", padding: "2px 6px" }}
              onClick={() => handleDelete(msg.idx!, msg.role)}
              disabled={deletingIds.has(msg.idx!)}
            >
              {deletingIds.has(msg.idx!) ? "Deleting..." : "Delete"}
            </button>

            {i === messages.length - 1 && msg.role === "character" && (
              <>
                <button
                  onClick={() => handleRegenerate()}
                  disabled={isRegenerating}
                  style={{ fontSize: "0.8rem", padding: "2px 6px" }}
                >
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  style={{ fontSize: "0.8rem", padding: "2px 6px" }}
                >
                  Regenerate with Instruction
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }}
            onClick={(e) => e.stopPropagation()} // prevent modal close on inner click
          >
            <h3>Regenerate with Instruction</h3>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              style={{ width: "100%", height: "80px" }}
            />
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={() => handleRegenerate(instruction)}
                disabled={isRegenerating}
              >
                {isRegenerating ? "Regenerating..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
