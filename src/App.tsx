import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Dashboard from './Dashboard';
import MyChats from './myChats';
import Conversation from './conversation';


export default function App() {
  const [session, setSession] = useState<any>(null);
  const [page, setPage] = useState<'dashboard' | 'my-chats' | 'conversation' >('dashboard');

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleNavigate = (newPage: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => {
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
    setPage(newPage);
  };

  useEffect(() => {
    // Check on load if there's an existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: '50px auto' }}>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]}/>
      </div>
    );
  }

  return (
    <div>
      {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {page === 'my-chats' && <MyChats onNavigate={handleNavigate} />}
      {page === 'conversation' && selectedConversationId && (
        <Conversation 
          onNavigate={handleNavigate} 
          conversationId={selectedConversationId} 
        />
      )}



    </div>
  );
}
