import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Dashboard from './Dashboard';

export default function App() {
  const [session, setSession] = useState<any>(null);

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
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
      </div>
    );
  }

  return <Dashboard />; // Or your main app
}
