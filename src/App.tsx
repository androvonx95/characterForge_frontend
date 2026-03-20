import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import Dashboard from './Dashboard';
import MyChats from './myChats';
import Conversation from './conversation';
import Settings from './Settings';
import AuthModal from './components/AuthModal';
import { SidebarProvider } from './components/SidebarProvider';



export default function App() {
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState<'dashboard' | 'my-chats' | 'conversation' | 'settings'>('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNavigate = (newPage: 'dashboard' | 'my-chats' | 'conversation' | 'settings', conversationId?: string) => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
    setPage(newPage);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div>
      {page === 'dashboard' && 
        <SidebarProvider>
          <Dashboard onNavigate={handleNavigate} isAuthenticated={!!session} onShowAuthModal={() => setShowAuthModal(true)} />
        </SidebarProvider>
      }
      {page === 'my-chats' && <SidebarProvider><MyChats onNavigate={handleNavigate} /></SidebarProvider>}
      {page === 'settings' && <SidebarProvider><Settings onNavigate={handleNavigate} /></SidebarProvider>}
      {page === 'conversation' && selectedConversationId && (
        <Conversation 
          onNavigate={handleNavigate} 
          conversationId={selectedConversationId} 
        />
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
