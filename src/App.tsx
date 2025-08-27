import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import Dashboard from './Dashboard';
import MyChats from './myChats';
import Conversation from './conversation';

// Custom futuristic dark theme for the auth UI with pink accents
const customTheme = {
  ...ThemeMinimal,
  default: {
    ...ThemeMinimal.default,
    colors: {
      ...ThemeMinimal.default.colors,
      // Base colors
      brand: '#ff69b4', // Pink accent
      brandAccent: '#ff85c2', // Lighter pink
      brandButtonText: '#ffffff',
      
      // Backgrounds
      defaultButtonBackground: 'rgba(255, 105, 180, 0.1)',
      defaultButtonBackgroundHover: 'rgba(255, 105, 180, 0.2)',
      defaultButtonBorder: 'rgba(255, 105, 180, 0.3)',
      defaultButtonText: '#ffffff',
      
      // Inputs
      inputBackground: '#1a1a1a',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputBorderHover: 'rgba(255, 105, 180, 0.5)',
      inputBorderFocus: 'rgba(184, 85, 134, 0.8)',
      inputText: '#f0f0f0',
      inputLabelText: '#b0b0b0',
      inputPlaceholder: '#666666',
      
      // Messages and UI elements
      messageText: '#ff69b4',
      messageBackground: 'rgba(255, 105, 180, 0.1)',
      dividerBackground: 'rgba(255, 255, 255, 0.1)',
      
      // Dark theme overrides
      anchorTextColor: '#ff69b4',
      anchorTextHoverColor: '#ff85c2',
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
const authContainerStyles: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr',
  padding: '0',
  background: 'radial-gradient(circle at 10% 20%, #0a0a0a 0%, #000000 90%)',
  color: '#e2e8f0',
  position: 'relative' as const,
  overflow: 'hidden',
};

const leftPanelStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '2rem 4rem',
  position: 'relative' as const,
  zIndex: 1,
};

const rightPanelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  position: 'relative' as const,
  zIndex: 1,
};

const heroTitle = {
  fontSize: '3.5rem',
  fontWeight: '800',
  background: 'linear-gradient(90deg, #ff69b4 0%, #ff85c2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '1.5rem',
  lineHeight: '1.2',
  letterSpacing: '-0.02em',
};

const heroSubtitle = {
  fontSize: '1.25rem',
  color: '#94a3b8',
  marginBottom: '2.5rem',
  lineHeight: '1.6',
  maxWidth: '90%',
};

const featureList: React.CSSProperties = {
  marginTop: '2rem',
  paddingLeft: '0',
  listStyle: 'none',
};

const featureItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '1.25rem',
  color: '#e2e8f0',
  fontSize: '1rem',
};

const featureIcon: React.CSSProperties = {
  width: '24px',
  height: '24px',
  marginRight: '12px',
  color: '#00f0ff',
  flexShrink: 0,
};

const authCardStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem',
  backgroundColor: 'rgba(10, 10, 15, 0.9)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
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
  background: 'linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 20, 147, 0.2))',
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
  background: 'linear-gradient(90deg, #ff69b4 0%, #ff85c2 100%)',
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
        {/* Left Panel - Hero Content */}
        <div style={leftPanelStyles}>
          <h1 style={heroTitle}>
            Welcome to <br />
            <span style={{ display: 'inline-block', marginTop: '0.5rem' }}>Nexus Platform</span>
          </h1>
          <p style={heroSubtitle}>
            Unlock endless stories with lifelike AI characters. Dive into thrilling adventures, heartfelt moments, or otherworldly tales — all shaped by your choices.
          </p>
          
          <ul style={featureList}>
            <li style={featureItem}>
              <span style={featureIcon}>✨</span>
              <span>Hyper-realistic AI characters</span>
            </li>
            <li style={featureItem}>
              <span style={featureIcon}>⚡</span>
              <span>Customizable scenarios & storylines</span>
            </li>
            <li style={featureItem}>
              <span style={featureIcon}>🔒</span>
              <span>Private, secure conversations</span>
            </li>
          </ul>
        </div>
        
        {/* Right Panel - Auth Form */}
        <div style={rightPanelStyles}>
          <div style={authCardStyles}>
            <div style={glowEffect}></div>
            <div style={logoContainerStyles}>
              <div style={logoStyles}>Get Started</div>
              <div style={taglineStyles}>Sign in to continue to Nexus</div>
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
