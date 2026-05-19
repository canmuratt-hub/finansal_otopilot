import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        const res = await api.login(form.email, form.password);
        localStorage.setItem('otopilot_token', res.token);
        onLogin();
      } else {
        const res = await api.register(form.name, form.email, form.password);
        localStorage.setItem('otopilot_token', res.token);
        onLogin();
      }
    } catch (err) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-glow-indigo animate-float-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Finansal Otopilot</h1>
          <p className="text-slate-500 mt-2">Kişisel yapay zeka asistanın ile finansını yönet.</p>
        </div>

        <div className="glass-strong p-8">
          <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">
            {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </h2>
          
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input pl-10"
                    placeholder="Ad Soyad"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="label">E-Posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-10"
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>

            <div>
              <label className="label">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-10"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button disabled={busy} type="submit" className="btn-primary w-full py-3 mt-2">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? 'Hesabın yok mu? Yeni kayıt oluştur.' : 'Zaten hesabın var mı? Giriş yap.'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
