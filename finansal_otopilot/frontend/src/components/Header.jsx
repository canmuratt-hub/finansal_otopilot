import { useEffect, useRef, useState } from 'react';
import {
  Rocket, Bell, Settings, LayoutDashboard, User, Sparkles, Sun, Moon,
  LogOut, Trash2, Shield, Calendar, AlertTriangle, X, Target,
} from 'lucide-react';
import { api } from '../api.js';

const useClickOutside = (ref, onOutside) => {
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside?.(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
};

export default function Header({
  apiOk = true, page = 'dashboard', onNavigate, reminder, onReminderClick,
  theme = 'light', onToggleTheme, onResetData,
}) {
  const [openBell, setOpenBell] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [subs, setSubs] = useState([]);
  const [goals, setGoals] = useState([]);
  const bellRef = useRef(null);
  const settingsRef = useRef(null);
  useClickOutside(bellRef, () => setOpenBell(false));
  useClickOutside(settingsRef, () => setOpenSettings(false));

  useEffect(() => {
    (async () => {
      try { const s = await api.listSubscriptions(); setSubs(s.data || []); } catch {}
      try { const g = await api.listGoals(); setGoals((g.data || []).filter((x) => x.status === 'active')); } catch {}
    })();
  }, []);

  // Bell notification list — yaklaşan abonelikler + aktif hedefler + Niko reminder
  const upcomingSubs = subs
    .filter((s) => s.next_renewal)
    .map((s) => ({ ...s, daysLeft: Math.ceil((new Date(s.next_renewal) - new Date()) / 86400000) }))
    .filter((s) => s.daysLeft >= 0 && s.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const notifCount = upcomingSubs.length + (reminder?.message ? 1 : 0);

  const NavBtn = ({ id, icon: Icon, label, tour }) => {
    const active = page === id;
    return (
      <button
        data-tour={tour}
        onClick={() => onNavigate?.(id)}
        className={`px-3 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-all duration-200 active:scale-95
          ${active
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'}`}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate?.('dashboard')} className="flex items-center gap-3 active:scale-95 transition">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-glow-indigo">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight text-left">
            <p className="font-display font-bold text-base text-slate-900">Finansal Otopilot</p>
            <p className="text-[11px] text-slate-500 -mt-0.5">NakitPilot AI · Niko Engine</p>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1.5">
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavBtn id="profile" icon={User} label="Profil" tour="profile-nav" />
        </nav>

        {reminder?.message && (
          <button
            onClick={onReminderClick}
            className="hidden lg:flex flex-1 max-w-md items-center gap-2 px-3 py-2 rounded-xl
                       bg-gradient-to-r from-amber-50 via-rose-50 to-fuchsia-50
                       border border-amber-200/60 text-left
                       hover:shadow-md transition-all active:scale-[0.99] animate-fade-in-up"
            title="Niko'dan hatırlatma"
          >
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-700 truncate">{reminder.message}</p>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className={`relative flex h-2 w-2 ${apiOk ? 'animate-pulse-dot' : ''}`}>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
            <span className="text-xs font-semibold text-emerald-700">Niko {apiOk ? 'Aktif' : 'Çevrimdışı'}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="btn-icon"
            title={theme === 'dark' ? 'Açık moda geç' : 'Karanlık moda geç'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Bell dropdown */}
          <div ref={bellRef} className="relative">
            <button onClick={() => { setOpenBell((o) => !o); setOpenSettings(false); }} className="btn-icon relative">
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
            {openBell && (
              <div className="absolute right-0 mt-2 w-80 glass-strong p-3 z-50 animate-scale-in">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="font-display font-bold text-sm text-slate-900">Bildirimler</p>
                  <button onClick={() => setOpenBell(false)} className="btn-icon !w-7 !h-7"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {reminder?.message && (
                    <button onClick={() => { onReminderClick?.(); setOpenBell(false); }} className="w-full text-left p-2.5 rounded-xl bg-amber-50 border border-amber-200 hover:shadow-sm transition-all active:scale-[0.98]">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">Niko Hatırlatma</p>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{reminder.message}</p>
                        </div>
                      </div>
                    </button>
                  )}
                  {upcomingSubs.map((s) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-fuchsia-50 border border-fuchsia-200">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-fuchsia-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-fuchsia-700 font-bold uppercase tracking-wider">Abonelik Yenilemesi</p>
                          <p className="text-xs text-slate-700 mt-0.5">
                            <span className="font-semibold">{s.name}</span> · {s.daysLeft === 0 ? 'bugün' : `${s.daysLeft} gün sonra`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goals.length > 0 && goals.slice(0, 2).map((g) => {
                    const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100));
                    return (
                      <div key={g.id} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Hedef İlerleme</p>
                            <p className="text-xs text-slate-700 mt-0.5"><span className="font-semibold">{g.title}</span> · %{pct}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {notifCount === 0 && goals.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-6">Yeni bildirim yok 🎉</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings dropdown */}
          <div ref={settingsRef} className="relative">
            <button onClick={() => { setOpenSettings((o) => !o); setOpenBell(false); }} className="btn-icon">
              <Settings className="w-4 h-4" />
            </button>
            {openSettings && (
              <div className="absolute right-0 mt-2 w-64 glass-strong p-2 z-50 animate-scale-in">
                <MenuItem icon={User} onClick={() => { onNavigate?.('profile'); setOpenSettings(false); }}>
                  Profilim
                </MenuItem>
                <MenuItem icon={theme === 'dark' ? Sun : Moon} onClick={() => { onToggleTheme?.(); }}>
                  {theme === 'dark' ? 'Açık Mod' : 'Karanlık Mod'}
                </MenuItem>
                <MenuItem icon={Shield} onClick={() => { alert('Gizlilik politikası yakında.'); }}>
                  Gizlilik & Güvenlik
                </MenuItem>
                <hr className="my-1.5 border-slate-200" />
                <MenuItem icon={Trash2} danger onClick={() => {
                  if (confirm('Tüm işlemler, abonelikler, sabit giderler ve hedefler silinecek. Emin misin?')) {
                    onResetData?.(); setOpenSettings(false);
                  }
                }}>
                  Hesabı Sıfırla
                </MenuItem>
                <MenuItem icon={AlertTriangle} danger onClick={() => {
                  if (confirm('Hesabını silmek tüm verileri kalıcı olarak siler. Devam edilsin mi?')) {
                    onResetData?.(); setOpenSettings(false);
                  }
                }}>
                  Hesabımı Sil
                </MenuItem>
                <MenuItem icon={LogOut} onClick={() => { alert('Çıkış yapıldı. (Demo)'); setOpenSettings(false); }}>
                  Çıkış Yap
                </MenuItem>
              </div>
            )}
          </div>

          <button onClick={() => onNavigate?.('profile')} className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition">
            MC
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2.5 transition-all active:scale-[0.98]
        ${danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}
