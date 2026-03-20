import { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeMinimal } from '@supabase/auth-ui-shared';
import supabase from '../supabaseClient';

const customTheme = {
  ...ThemeMinimal,
  default: {
    ...ThemeMinimal.default,
    colors: {
      ...ThemeMinimal.default.colors,
      brand: '#ff4081',
      brandAccent: '#ff5c93',
      brandButtonText: '#ffffff',
      defaultButtonBackground: 'rgba(255, 64, 129, 0.1)',
      defaultButtonBackgroundHover: 'rgba(255, 64, 129, 0.2)',
      defaultButtonBorder: 'rgba(255, 64, 129, 0.3)',
      defaultButtonText: '#ffffff',
      inputBackground: '#1a1a1a',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputBorderHover: 'rgba(255, 64, 129, 0.5)',
      inputBorderFocus: 'rgba(255, 64, 129, 0.8)',
      inputText: '#f0f0f0',
      inputLabelText: '#b0b0b0',
      inputPlaceholder: '#666666',
      messageText: '#ff4081',
      messageBackground: 'rgba(255, 64, 129, 0.1)',
      dividerBackground: 'rgba(255, 255, 255, 0.1)',
      anchorTextColor: '#ff4081',
      anchorTextHoverColor: '#ff5c93',
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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onClose();
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f0f0f',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2.5rem',
          maxWidth: '420px',
          width: '100%',
          margin: '1rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ff4081 0%, #ff6b9d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 0.5rem 0',
            }}
          >
            Join the adventure
          </h2>
          <p
            style={{
              color: '#b0b0b0',
              margin: 0,
              fontSize: '0.9rem',
            }}
          >
            Sign in or create an account to start chatting
          </p>
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
                link_text: 'Don\'t have an account? Sign up',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                email_input_placeholder: 'your@email.com',
                password_input_placeholder: 'Create a password',
                button_label: 'Sign up',
                loading_button_label: 'Signing up...',
                link_text: 'Already have an account? Sign in',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
