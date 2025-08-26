import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import Dashboard from './Dashboard';
import MyChats from './myChats';
import Conversation from './conversation';

// Custom futuristic dark theme for the auth UI
const customTheme = {
  ...ThemeMinimal,
  default: {
    ...ThemeMinimal.default,
    colors: {
      ...ThemeMinimal.default.colors,
      // Base colors
      brand: '#00f0ff',
      brandAccent: '#00c2d1',
      brandButtonText: '#0a0f1a',
      
      // Backgrounds
      defaultButtonBackground: 'rgba(0, 240, 255, 0.1)',
      defaultButtonBackgroundHover: 'rgba(0, 240, 255, 0.2)',
      defaultButtonBorder: 'rgba(0, 240, 255, 0.3)',
      defaultButtonText: '#ffffff',
      
      // Inputs
      inputBackground: '#0f1624',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputBorderHover: 'rgba(0, 240, 255, 0.5)',
      inputBorderFocus: 'rgba(0, 240, 255, 0.8)',
      inputText: '#e2e8f0',
      inputLabelText: '#94a3b8',
      inputPlaceholder: '#4a5568',
      
      // Messages and UI elements
      messageText: '#00f0ff',
      messageBackground: 'rgba(0, 240, 255, 0.1)',
      dividerBackground: 'rgba(255, 255, 255, 0.1)',
      
      // Dark theme overrides
      anchorTextColor: '#00f0ff',
      anchorTextHoverColor: '#00c2d1',
    },
    space: {
      ...ThemeMinimal.default.space,
      spaceSmall: '6px',
      spaceMedium: '12px',
      spaceLarge: '24px',
      labelBottomMargin: '8px',
      anchorBottomMargin: '4px',
      emailInputSpacing: '6px',
      socialAuthSpacing: '16px',
      buttonPadding: '12px 20px',
      inputPadding: '12px 16px',
    },
    radii: {
      borderRadiusButton: '8px',
      buttonBorderRadius: '8px',
      inputBorderRadius: '8px',
    },
  },
};

// Custom styles for the auth container
const authContainerStyles = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'radial-gradient(circle at top right, #0f172a 0%, #0a0f1a 100%)',
  color: '#e2e8f0',
};

const authCardStyles = {
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem',
  backgroundColor: 'rgba(15, 22, 36, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
  position: 'relative' as const,
  overflow: 'hidden',
};

// Glow effect for the card
const glowEffect = {
  content: '""',
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: '16px',
  padding: '1px',
  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(56, 178, 172, 0.1))',
  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  WebkitMaskComposite: 'xor',
  maskComposite: 'exclude',
  pointerEvents: 'none' as const,
};

const logoContainerStyles = {
  textAlign: 'center' as const,
  marginBottom: '2rem',
  position: 'relative' as const,
  zIndex: 1,
};

const logoStyles = {
  fontSize: '2rem',
  fontWeight: '800',
  background: 'linear-gradient(90deg, #00f0ff 0%, #00c2d1 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '0.5rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
};

const taglineStyles = {
  color: '#94a3b8',
  fontSize: '0.9rem',
  fontWeight: '400',
  letterSpacing: '0.05em',
};


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
      <div style={authContainerStyles}>
        <div style={authCardStyles}>
          <div style={glowEffect}></div>
          <div style={logoContainerStyles}>
            <div style={logoStyles}>Nexus</div>
            <div style={taglineStyles}>The future of communication</div>
          </div>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: customTheme,
              style: {
                button: { 
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                },
                input: {
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                },
                // Add more custom styles as needed
              },
            }} 
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  link_text: 'Already have an account? Sign in',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'your@email.com',
                  password_input_placeholder: 'Create a password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  link_text: 'Don\'t have an account? Sign up',
                },
                // Add more custom text as needed
              },
            }}
          />
        </div>
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
