import { useState } from 'react';
import { X } from 'lucide-react';
import kadoshIcon from '../kadosh-ai-icon.png';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string, companyName: string, role: string) => Promise<void>;
  onShowPrivacy: () => void;
}

export default function AuthModal({ isOpen, onClose, onLogin, onSignUp, onShowPrivacy }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager'>('Manager');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  // NEW: PDPA checkbox state (required for signup)
  const [acceptedPDPA, setAcceptedPDPA] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Enforce PDPA acceptance for signup
      if (mode === 'signup' && !acceptedPDPA) {
        setError('You must accept the PDPA / privacy policy to create an account.');
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        await onLogin(email, password);
        resetForm();
      } else {
        await onSignUp(email, password, name, companyName, role);
        setConfirmationEmail(email);
        // keep PDPA flagged until modal is closed or form reset
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setCompanyName('');
    setRole('Manager');
    setError('');
    setConfirmationEmail('');
    setAcceptedPDPA(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setConfirmationEmail('');
    setAcceptedPDPA(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-labelledby="auth-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Modal (liquid glass) */}
      <div className="relative w-full max-w-md mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            // layered glass effect: subtle gradient, translucent fill, soft border
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.32) 100%)',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 10px 30px rgba(2,6,23,0.12)',
            backdropFilter: 'blur(12px) saturate(120%)',
          }}
        >
          {/* Decorative top-right image (uses uploaded local asset path) */}
          <div className="absolute top-4 right-16 -z-0 opacity-30 pointer-events-none">
            <img
              src={kadoshIcon}
              alt="Kadosh AI"
              className="w-30 h-8"
            />
          </div>

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 id="auth-modal-title" className="text-lg font-semibold text-slate-900">
              {mode === 'login' ? 'Login' : 'Create your account'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-slate-700 hover:bg-white/30 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 relative">
            {/* Floating subtle separator line */}
            <div className="absolute left-6 right-6 top-20 opacity-10 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent pointer-events-none" />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {confirmationEmail && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <p>
                  Confirmation email has been sent to <strong>{confirmationEmail}</strong>. Click the confirmation link in your inbox to activate your account.
                </p>
              </div>
            )}

            {!confirmationEmail && mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-800 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-800 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your company name"
                    required
                  />
                </div>
              </>
            )}

            {!confirmationEmail && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/70 border border-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}

            {!confirmationEmail && mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-3">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start cursor-pointer p-3 rounded-lg bg-white/60 border border-white/80">
                      <input
                        type="radio"
                        name="role"
                        value="Admin"
                        checked={role === 'Admin'}
                        onChange={(e) => setRole(e.target.value as 'Admin' | 'Manager')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-slate-900">Admin</span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Full system access. Can manage all feedback requests and users.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start cursor-pointer p-3 rounded-lg bg-white/60 border border-white/80">
                      <input
                        type="radio"
                        name="role"
                        value="Manager"
                        checked={role === 'Manager'}
                        onChange={(e) => setRole(e.target.value as 'Admin' | 'Manager')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="ml-3">
                        <span className="font-medium text-slate-900">Manager</span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Manage assigned feedback and take actions on requests you own.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* PDPA checkbox required for signup */}
                <div className="mt-4 flex items-start gap-3">
                  <input
                    id="pdpa"
                    type="checkbox"
                    checked={acceptedPDPA}
                    onChange={(e) => setAcceptedPDPA(e.target.checked)}
                    className="mt-1 accent-blue-500 w-4 h-4 rounded"
                  />
                  <label htmlFor="pdpa" className="text-sm text-slate-800">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onShowPrivacy();
                      }}
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      PDPA / privacy policy
                    </button>{' '}
                    and consent to my data being used for account creation and service personalization.
                  </label>
                </div>
              </>
            )}

            {!confirmationEmail && (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold transition disabled:opacity-60"
                style={{
                  background: 'linear-gradient(90deg,#4f46e5,#06b6d4)',
                  color: 'white',
                  boxShadow: '0 8px 20px rgba(79,70,229,0.12)',
                }}
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm font-medium text-gray-900 hover:text-gray-1000 transition"
              >
                {mode === 'login' ? (
                  <>Don't have an account? <span className="underline">Sign Up</span></>
                ) : (
                  <>Already have an account? <span className="underline">Login</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
