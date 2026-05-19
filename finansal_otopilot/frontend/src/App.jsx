import { useEffect, useState, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import AIInsightCard from './components/AIInsightCard.jsx';
import TrendChart from './components/TrendChart.jsx';
import TransactionList from './components/TransactionList.jsx';
import FloatingActionButton from './components/FloatingActionButton.jsx';
import QuickActionModal from './components/QuickActionModal.jsx';
import Profile from './components/Profile.jsx';
import NikoChat from './components/NikoChat.jsx';
import Onboarding from './components/Onboarding.jsx';
import Auth from './components/Auth.jsx';
import { api } from './api.js';

const FALLBACK = [];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('otopilot_token'));
  const [page, setPage] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOk, setApiOk] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [insightKey, setInsightKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reminder, setReminder] = useState(null);
  const [userName, setUserName] = useState('Kullanıcı');
  const reminderTimer = useRef(null);

  // Theme state — localStorage persistent
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('fo-theme') || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('fo-theme', theme); } catch {}
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const p = await api.getProfile();
      if (p?.data?.name) setUserName(p.data.name);

      const res = await api.listTransactions();
      const data = res.data || res;
      if (Array.isArray(data)) { setTransactions(data); setApiOk(true); }
      else { setTransactions(FALLBACK); setApiOk(true); }
    } catch {
      setTransactions(FALLBACK); setApiOk(false);
    } finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchReminder = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await api.goalReminder();
      if (r?.data?.message) setReminder(r.data);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setTimeout(fetchReminder, 4000);
    reminderTimer.current = setInterval(fetchReminder, 120000);
    // Parse token to get user_id for unique onboarding key
    let userId = 'default';
    try {
      const t = localStorage.getItem('otopilot_token');
      if (t) userId = JSON.parse(atob(t.split('.')[1])).user_id || 'default';
    } catch {}

    const onboardKey = `fo_onboarded_${userId}`;
    if (!localStorage.getItem(onboardKey)) {
      setShowOnboarding(true);
      localStorage.setItem(onboardKey, '1');
    }
    return () => { clearTimeout(t); clearInterval(reminderTimer.current); };
  }, [fetchReminder, isAuthenticated]);

  useEffect(() => {
    const handleAuthError = () => {
      setIsAuthenticated(false);
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('otopilot_token');
    setIsAuthenticated(false);
  };

  const onSaved = async () => {
    await loadData();
    setInsightKey((k) => k + 1);
  };

  const onResetData = async () => {
    try {
      await api.resetAll();
      await loadData();
      setInsightKey((k) => k + 1);
      alert('Tüm verileriniz silindi.');
    } catch (e) { alert('Sıfırlama hatası: ' + e.message); }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        apiOk={apiOk}
        page={page}
        onNavigate={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        reminder={reminder}
        onReminderClick={() => setPage('profile')}
        theme={theme}
        onToggleTheme={toggleTheme}
        onResetData={onResetData}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {page === 'dashboard' && (
          <>
            <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 animate-fade-in-up">
              <div>
                <p className="text-slate-500 text-sm flex items-center justify-between">
                  Hoş geldin, {userName}
                  <button onClick={handleLogout} className="ml-4 text-rose-500 hover:text-rose-600 underline">Çıkış Yap</button>
                </p>
                <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900">
                  Finansal{' '}
                  <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-shift">
                    Otopilot
                  </span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">Yapay zekâ destekli akıllı para yönetim panelin.</p>
              </div>
              <div className="text-xs text-slate-400">
                {loading ? 'Veriler yükleniyor…' : `${transactions.length} işlem yüklendi`}
              </div>
            </section>

            <SummaryCards transactions={transactions} />

            {/* Ajan Tavsiyesi — TAM GENİŞLİK, HORİZONTAL */}
            <AIInsightCard refreshKey={insightKey} />

            {/* Chart + Niko — yan yana, eşit yükseklik */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><TrendChart transactions={transactions} /></div>
              <div className="lg:col-span-1"><NikoChat onActionsExecuted={onSaved} /></div>
            </div>

            <TransactionList transactions={transactions} loading={loading} />
          </>
        )}

        {page === 'profile' && <Profile />}
      </main>

      <footer className="text-center text-xs text-slate-500 py-6">
        © 2026 Finansal Otopilot · NakitPilot AI · Niko Engine v1.0 · Gemini powered
      </footer>

      <FloatingActionButton onClick={() => setModalOpen(true)} />
      <QuickActionModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={onSaved} />

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
