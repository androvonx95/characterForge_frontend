import { useEffect, useState, type JSX } from 'react';
import supabase from './supabaseClient';
import { getBotAndLastMessage } from './fetchBotAndLastMessage';
import { deleteEntity } from './deleteCharOrConv';
import { getEntityDeletionDetails } from './getEntityDeletionInfo';
import './styles/global.css';
import './styles/MyChats.css'; // Import the CSS styles
import { getCharacterById } from './getCharacterInfo';
// Import sidebar components
import { Sidebar } from './components/Sidebar';
import { useSidebar } from './components/SidebarProvider';

interface ChatDetail {
  id: string;
  botName: string;
  lastMessage: string;
  imageUrl?: string;
}

export default function MyChats({
  onNavigate,
}: {
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
}) {
  const [chats, setChats] = useState<ChatDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const DEFAULT_IMAGE_URL = 'https://imgs.search.brave.com/pnuCjus6wNu_B0lj4soEUb4KKx9_pn-HorGYVHwBMwY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTIyMjUvMTIy/MjU4ODEucG5n';

  // Get sidebar state for responsive layout
  const { isOpen } = useSidebar();

  useEffect(() => {
    async function fetchChats() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error('You are not authenticated');
        const token = data.session.access_token;
        if (!token) throw new Error('No token found');

        const response = await fetch(import.meta.env.VITE_GET_USER_CONVERSATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch chats');
        }

        const result = await response.json();
        const conversations = result.conversations || [];

        const detailedChats = await Promise.all(
          conversations.map(async (conv: { id: string }) => {
            try {
              const detail = await getBotAndLastMessage(conv.id);
              const botData = detail?.result?.[0];
              const characterId = botData?.bot_id;
              let imageUrl: string | undefined;
        
              if (characterId) {
                const characterData = await getCharacterById(characterId);
                
                if (characterData?.character?.prompt) {
                  let parsedPrompt;
                  
                  try {
                    // Try parsing the prompt as JSON
                    parsedPrompt = JSON.parse(characterData.character.prompt);
                    imageUrl = parsedPrompt?.imageUrl || undefined;
                  } catch (e) {
                    // If it's not valid JSON, treat it as plain text (legacy bots)
                    console.warn(`Legacy prompt for bot: ${botData.bot_name}. Using default behavior.`);
                    imageUrl = DEFAULT_IMAGE_URL; // Or handle as per your requirements (e.g., no image)
                  }
                }
              }
        
              return {
                id: conv.id,
                botName: botData?.bot_name?.trim() || 'Unknown Bot',
                lastMessage: botData?.last_message_content || 'No messages yet',
                last_message_created_at: botData?.last_message_created_at,
                imageUrl,
              };
            } catch (error) {
              console.error('Error fetching chat detail for', conv.id, error);
              return {
                id: conv.id,
                botName: 'Unknown Bot',
                lastMessage: 'No messages yet',
                imageUrl: DEFAULT_IMAGE_URL,
              };
            }
          })
        );
        const sortedChats = detailedChats.sort((a, b) => {
          return new Date(b.last_message_created_at).getTime() - new Date(a.last_message_created_at).getTime();
        });
        
        setChats(sortedChats);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchChats();
  }, []);
  function formatDeemphasizedText(text: string): (string | JSX.Element)[] {
    return text.split(/\*(.*?)\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <span
          key={i}
          style={{
            color: '#ddd',          // Light gray, but not too light
            fontStyle: 'italic',
            opacity: 0.85,          // Less transparent than before
            fontWeight: 400,
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  }
  return (
    <div className="app-layout">
      <Sidebar onNavigate={onNavigate} currentPage="my-chats" />
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="myChats-container">


          <div className="myChats-content">
            {loading && <p className="myChats-loading">Loading chats...</p>}
            {error && <p className="myChats-error">Error: {error}</p>}
            
            {!loading && !error && chats.length === 0 ? (
              <p className="myChats-noChats">No chats yet.</p>
            ) : (
              
              <div className="myChats-list">
                {/* <h5 className="myChats-title">My Chats</h5> */}
                {chats.map(({ id, botName, lastMessage, imageUrl }) => (

                  <div className="myChats-cardWrapper" key={id}> 
                    
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onNavigate('conversation', id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onNavigate('conversation', id);
                        }
                      }}
                      className="myChats-card"
                      title={`Conversation with ${botName}`}
                    >
                      <div className="myChats-cardHeader">
                        <img
                          src={imageUrl || DEFAULT_IMAGE_URL}
                          alt={`${botName}'s avatar`}
                          className="myChats-avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE_URL;
                          }}
                        />
                        <div className="myChats-botName">{botName}</div>
                      </div>
                      <div className="myChats-lastMessage" title={lastMessage}>
                        {formatDeemphasizedText(lastMessage) || <i>No messages yet</i>}
                      </div>
                      <small className="myChats-conversationId">Conversation ID: {id}</small>
                    </div>
                  
                    <button className="myChats-deleteBtn" 
                      onClick={async () => {
                        try {
                          // Delete the entity
                          await deleteEntity({ entity_id: id, entity_type: 'conversation' });
                    
                          // Immediately remove the deleted conversation from the state
                          setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
                        } catch (error) {
                          console.error('Error deleting conversation:', error);
                        }
                      }}>
                      &#x1F5D1;</button>

                  </div>
                  
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}