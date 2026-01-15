import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
  const { user, profile, loading, signIn, signUp, signOut } = useAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name: string,
    companyName: string,
    role: string
  ) => {
    await signUp(email, password, name, companyName, role);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showPrivacy) {
    return <PrivacyPolicy onBack={() => setShowPrivacy(false)} />;
  }

  if (user && profile) {
    return (
      <Dashboard
        userId={profile.id}
        userName={profile.name}
        userEmail={profile.email}
        userRole={profile.role}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LandingPage
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onShowPrivacy={() => setShowPrivacy(true)}
    />
  );
}

export default App;
