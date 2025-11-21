import { ArrowRight, Inbox, Bot, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, name: string, companyName: string, role: string) => Promise<void>;
}

export default function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLoginClick = () => {
    setShowAuthModal(true);
  };

  const handleGetStartedClick = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      {/* Header */}
      <header className="relative z-20">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Feedback Normalizer</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoginClick}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm hover:bg-gray-50 transition"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: content */}
          <div className="lg:col-span-7">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
              Never Lose Another <br /> Feedback Request
            </h2>

            <p className="mt-6 text-lg text-slate-600 max-w-2xl">
              Unified intake with automatic triage, smart assignment, and accountability tracking — turn messy feedback into prioritized action.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={handleGetStartedClick}
                className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-1000 text-white font-semibold text-lg px-6 py-3 rounded-full shadow-md transition transform hover:-translate-y-0.5"
                aria-label="Get Started"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* small features row */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl text-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">✓</div>
                <div>
                  <div className="font-medium text-slate-800">Automated triage</div>
                  <div className="text-slate-500">Save time and reduce noise</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">⚡</div>
                <div>
                  <div className="font-medium text-slate-800">Fast routing</div>
                  <div className="text-slate-500">Send feedback to the right owner</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center text-rose-600">🔒</div>
                <div>
                  <div className="font-medium text-slate-800">Secure</div>
                  <div className="text-slate-500">Enterprise-ready controls</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: glass preview card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              {/* Glass card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl"
                   style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Decorative blurred glow behind card */}
                <div className="absolute -inset-1 blur-xl opacity-20" style={{ background: 'linear-gradient(90deg,#06b6d4,#6d28d9)'}} aria-hidden />

                <div className="relative p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-8 w-8 rounded-md bg-white/6" />
                    <div className="text-xs text-black/60">Live preview</div>
                  </div>

                  {/* Preview image (local file path used below) */}
                  <div className="rounded-lg overflow-hidden border border-black/6">
                    <img
                      src="Apppreview.png"
                      alt="App preview"
                      className="w-full h-56 object-cover"
                    />
                  </div>

                  <div className="mt-4 text-sm text-black/80">
                    See how Feedback Normalizer organizes feedback, auto-triages, and surfaces actionable items.
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-black/60">Trusted by product teams</div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGetStartedClick}
                        className="px-3 py-1 rounded-full bg-gray-900 text-white text-sm"
                      >
                        Try it
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefit cards row */}
        <section className="mt-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-slate-800 text-white flex items-center justify-center mb-4">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Unified Inbox</h3>
              <p className="text-sm text-slate-600">All feedback in one place — no more lost emails or chat messages. Centralized intake and history.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Auto-Triage</h3>
              <p className="text-sm text-slate-600">Automatically categorize and prioritize with intelligent extraction and routing to owners.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-4">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Clear Accountability</h3>
              <p className="text-sm text-slate-600">Track owners, statuses, and due dates in real time so every piece of feedback leads to action.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Feedback Normalizer</div>
          <div className="hidden sm:flex gap-6">
            <a href="#terms" className="hover:underline">Terms</a>
            <a href="#privacy" className="hover:underline">Privacy</a>
          </div>
        </div>
      </footer>

      {/* Auth modal unchanged */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={onLogin}
        onSignUp={onSignUp}
      />
    </div>
  );
}
