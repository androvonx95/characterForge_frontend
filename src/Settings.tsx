import { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { Sidebar } from './components/Sidebar';
import { useSidebar } from './components/SidebarProvider';
import './styles/Settings.css';

interface SettingsProps {
  onNavigate: (page: 'dashboard' | 'my-chats' | 'conversation' | 'settings', conversationId?: string) => void;
}

const Settings = ({ onNavigate }: SettingsProps) => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const { isOpen } = useSidebar();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserEmail(data.session.user.email || '');
      }
    };
    getUser();
  }, []);

  const handlePasswordChange = async () => {
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setPasswordError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = data.session.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/password-reset-self`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        setPasswordError('Unexpected response from server');
        return;
      }

      if (!response.ok) {
        setPasswordError(result.error || 'Failed to update password');
        return;
      }

      setPasswordMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        setPasswordError('Network error: Unable to reach the server. Please check your connection and try again.');
      } else {
        setPasswordError(err.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onNavigate('dashboard');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar onNavigate={onNavigate} currentPage="settings" />
      <main className={`main-content ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <div className="settings-container">
          <div className="settings-header">
            <h1>Settings & Preferences</h1>
            <p>Manage your account and customize your experience</p>
          </div>

          {/* User Profile Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>User Profile</h2>
            </div>
            <div className="section-content">
              <div className="profile-info">
                <div className="info-group">
                  <label>Email Address</label>
                  <p className="info-value">{userEmail || 'Loading...'}</p>
                </div>
                <div className="info-group">
                  <label>Account Status</label>
                  <p className="info-value">Active</p>
                </div>
                <div className="info-group">
                  <label>Member Since</label>
                  <p className="info-value">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Account Management Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>Account Management</h2>
            </div>
            <div className="section-content">
              <div className="password-change">
                <h3>Change Password</h3>
                <div className="form-group">
                  <label htmlFor="current-pwd">Current Password</label>
                  <input
                    id="current-pwd"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-pwd">New Password</label>
                  <input
                    id="new-pwd"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-pwd">Confirm Password</label>
                  <input
                    id="confirm-pwd"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                {passwordMessage && <div className="message success">{passwordMessage}</div>}
                {passwordError && <div className="message error">{passwordError}</div>}
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </section>

          {/* Display Preferences Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>Display Preferences</h2>
            </div>
            <div className="section-content">
              <div className="preference-item">
                <div className="preference-info">
                  <h3>Dark Mode</h3>
                  <p>Use dark theme for the interface</p>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="dark-mode"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                  <label htmlFor="dark-mode" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </section>

          {/* Notification Settings Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>Notification Settings</h2>
            </div>
            <div className="section-content">
              <div className="preference-item">
                <div className="preference-info">
                  <h3>Email Notifications</h3>
                  <p>Receive updates about your conversations and new messages</p>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="email-notify"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <label htmlFor="email-notify" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </section>

          {/* Session & Security Section */}
          <section className="settings-section">
            <div className="section-header">
              <h2>Session & Security</h2>
            </div>
            <div className="section-content">
              <div className="security-info">
                <p>To maintain your account security, you can sign out from all devices.</p>
                <button onClick={handleLogout} className="btn btn-logout">
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
