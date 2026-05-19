import { useEffect, useState } from 'react';
import {
  User, Mail, Wallet, Shield, Save, Loader2, CheckCircle2, TrendingUp, Activity, Zap,
  Tv, Music, Home, Target, Plus, Trash2, Calendar, DollarSign, Flag, Sparkles,
} from 'lucide-react';
import { api } from '../api.js';

const RISK_OPTIONS = [
  { id: 'Güvenli', desc: 'Düşük risk, düşük getiri', icon: Shield, iconBg: 'bg-sky-50', iconBorder: 'border-sky-200', iconColor: 'text-sky-600', activeBg: 'from-sky-100 to-sky-50' },
  { id: 'Dengeli', desc: 'Orta risk, dengeli getiri', icon: Activity, iconBg: 'bg-violet-50', iconBorder: 'border-violet-200', iconColor: 'text-violet-600', activeBg: 'from-violet-100 to-violet-50' },
  { id: 'Agresif', desc: 'Yüksek risk, yüksek getiri', icon: Zap, iconBg: 'bg-amber-50', iconBorder: 'border-amber-200', iconColor: 'text-amber-600', activeBg: 'from-amber-100 to-amber-50' },
];

const TABS = [
  { id: 'info', label: 'Profil', icon: User },
  { id: 'subs', label: 'Abonelikler', icon: Tv },
  { id: 'fixed', label: 'Sabit Giderler', icon: Home },
  { id: 'goals', label: 'Hedeflerim', icon: Target },
];

const formatTRY = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0);

export default function Profile() {
  const [tab, setTab] = useState('info');
  return (
    <div className="space-y-6">
      <section>
        <p className="text-slate-500 text-sm">Ayarlar</p>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900">
          Profil &{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-shift">Tercihler</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">Niko bu bilgilere göre tavsiyelerini kişiselleştirir.</p>
      </section>

      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-soft overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-95
                ${active ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in-up">
        {tab === 'info' && <ProfileInfo />}
        {tab === 'subs' && <SubscriptionsTab />}
        {tab === 'fixed' && <FixedExpensesTab />}
        {tab === 'goals' && <GoalsTab />}
      </div>
    </div>
  );
}

// ----------------------- INFO TAB -----------------------
function ProfileInfo() {
  const [form, setForm] = useState({ name: '', email: '', monthly_budget: 10000, risk_profile: 'Dengeli', preferred_currency: 'TRY' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getProfile();
        if (res?.data) setForm({
          name: res.data.name || '', email: res.data.email || '',
          monthly_budget: Number(res.data.monthly_budget) || 0,
          risk_profile: res.data.risk_profile || 'Dengeli',
          preferred_currency: res.data.preferred_currency || 'TRY',
        });
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try { await api.updateProfile(form); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="soft-card p-10 text-center text-slate-500 inline-flex items-center justify-center gap-2 w-full"><Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor…</div>;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="soft-card p-6 lg:col-span-2 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-glow-violet">
            {(form.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-display font-bold text-lg text-slate-900">{form.name || 'Kullanıcı'}</p>
            <p className="text-xs text-slate-500">Niko AI üyesi · {form.risk_profile} profil</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İsim" icon={User}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Adın" required />
          </Field>
          <Field label="E-posta" icon={Mail}>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="ornek@mail.com" />
          </Field>
          <Field label="Aylık Hedef Bütçe (TL)" icon={Wallet}>
            <input type="number" min="0" value={form.monthly_budget} onChange={(e) => setForm({ ...form, monthly_budget: Number(e.target.value) })} className="input" required />
          </Field>
          <Field label="Para Birimi" icon={TrendingUp}>
            <select value={form.preferred_currency} onChange={(e) => setForm({ ...form, preferred_currency: e.target.value })} className="input">
              <option value="TRY">TRY · Türk Lirası</option>
              <option value="USD">USD · Dolar</option>
              <option value="EUR">EUR · Euro</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="soft-card p-6 space-y-3">
        <p className="text-xs uppercase tracking-widest text-violet-700 font-bold">Yatırım Risk Tercihi</p>
        <div className="space-y-2">
          {RISK_OPTIONS.map((r) => {
            const Icon = r.icon;
            const active = form.risk_profile === r.id;
            return (
              <button key={r.id} type="button" onClick={() => setForm({ ...form, risk_profile: r.id })}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 active:scale-[0.98]
                  ${active ? `bg-gradient-to-br ${r.activeBg} border-violet-200 shadow-md` : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.iconBg} border ${r.iconBorder}`}>
                  <Icon className={`w-5 h-5 ${r.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{r.id}</p>
                  <p className="text-[11px] text-slate-500">{r.desc}</p>
                </div>
                {active && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs">
          {error && <span className="text-rose-600">⚠ {error}</span>}
          {saved && <span className="text-emerald-600 inline-flex items-center gap-1 font-semibold"><CheckCircle2 className="w-4 h-4" /> Kaydedildi. Niko artık bu tercihlere göre tavsiye verecek.</span>}
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor…' : 'Profili Kaydet'}
        </button>
      </div>
    </form>
  );
}

// ----------------------- SUBSCRIPTIONS TAB -----------------------
function SubscriptionsTab() {
  return (
    <CrudTab
      title="Aboneliklerim"
      subtitle="Netflix, Spotify, YouTube vb. Niko bunları toplam abonelik harcaman için kullanır."
      headerIcon={Tv}
      fetchList={api.listSubscriptions}
      createItem={api.createSubscription}
      deleteItem={api.deleteSubscription}
      emptyText="Henüz abonelik eklemedin."
      fields={[
        { name: 'name', label: 'Abonelik Adı', type: 'text', placeholder: 'Netflix', required: true },
        { name: 'amount', label: 'Tutar (TL)', type: 'number', placeholder: '199.99', required: true },
        { name: 'cycle', label: 'Periyot', type: 'select', options: [['monthly', 'Aylık'], ['yearly', 'Yıllık']] },
        { name: 'next_renewal', label: 'Sonraki Yenileme', type: 'date' },
      ]}
      renderItem={(s) => (
        <>
          <div className="w-10 h-10 rounded-xl bg-fuchsia-50 border border-fuchsia-200 flex items-center justify-center">
            <Tv className="w-5 h-5 text-fuchsia-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{s.name}</p>
            <p className="text-xs text-slate-500">
              {s.cycle === 'yearly' ? 'Yıllık' : 'Aylık'}
              {s.next_renewal && ` · Yenileme: ${new Date(s.next_renewal).toLocaleDateString('tr-TR')}`}
            </p>
          </div>
          <p className="font-bold text-slate-900">{formatTRY(s.amount)}</p>
        </>
      )}
    />
  );
}

// ----------------------- FIXED EXPENSES TAB -----------------------
function FixedExpensesTab() {
  return (
    <CrudTab
      title="Sabit Giderler"
      subtitle="Kira, fatura, kredi gibi her ay tekrar eden ödemelerin."
      headerIcon={Home}
      fetchList={api.listFixedExpenses}
      createItem={api.createFixedExpense}
      deleteItem={api.deleteFixedExpense}
      emptyText="Henüz sabit gider eklemedin."
      fields={[
        { name: 'name', label: 'Gider Adı', type: 'text', placeholder: 'Kira', required: true },
        { name: 'amount', label: 'Tutar (TL)', type: 'number', placeholder: '8500', required: true },
        { name: 'due_day', label: 'Ödeme Günü (1-31)', type: 'number' },
        { name: 'category', label: 'Kategori', type: 'select', options: [['Kira', 'Kira'], ['Fatura', 'Fatura'], ['Kredi', 'Kredi'], ['Diğer', 'Diğer']] },
      ]}
      renderItem={(s) => (
        <>
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
            <Home className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{s.name}</p>
            <p className="text-xs text-slate-500">
              {s.category || 'Sabit gider'}
              {s.due_day && ` · Her ayın ${s.due_day}'i`}
            </p>
          </div>
          <p className="font-bold text-slate-900">{formatTRY(s.amount)}</p>
        </>
      )}
    />
  );
}

// ----------------------- GOALS TAB -----------------------
function GoalsTab() {
  return (
    <CrudTab
      title="Finansal Hedeflerim"
      subtitle="Niko hedeflerini hatırlatır ve sana özel tasarruf planı çıkarır."
      headerIcon={Target}
      fetchList={api.listGoals}
      createItem={api.createGoal}
      deleteItem={api.deleteGoal}
      emptyText="Henüz hedef eklemedin. İlk hedefini ekle, Niko sana yol göstersin!"
      fields={[
        { name: 'title', label: 'Hedef', type: 'text', placeholder: 'Yeni Bilgisayar', required: true },
        { name: 'target_amount', label: 'Toplam Tutar (TL)', type: 'number', placeholder: '30000', required: true },
        { name: 'current_amount', label: 'Şu Anki Birikim (TL)', type: 'number', placeholder: '0' },
        { name: 'deadline', label: 'Hedef Tarihi', type: 'date' },
      ]}
      renderItem={(g) => {
        const pct = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)) || 0;
        return (
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Flag className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{g.title}</p>
                <p className="text-xs text-slate-500">{formatTRY(g.current_amount)} / {formatTRY(g.target_amount)} · %{pct}{g.deadline && ` · ${new Date(g.deadline).toLocaleDateString('tr-TR')}`}</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      }}
      itemLayout="block"
    />
  );
}

// ----------------------- Reusable CRUD Tab -----------------------
function CrudTab({ title, subtitle, headerIcon: HIcon, fetchList, createItem, deleteItem, fields, renderItem, emptyText, itemLayout = 'row' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await fetchList(); setItems(r.data || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onAdd = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      await createItem(form);
      setForm({}); setAdding(false);
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const onDelete = async (id) => {
    if (!confirm('Silmek istediğine emin misin?')) return;
    try { await deleteItem(id); await load(); } catch (err) { alert(err.message); }
  };

  return (
    <div className="soft-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <HIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-display font-bold text-lg text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button onClick={() => setAdding((a) => !a)} className={adding ? 'btn-secondary' : 'btn-primary'}>
          {adding ? 'İptal' : (<><Plus className="w-4 h-4" /> Yeni Ekle</>)}
        </button>
      </div>

      {adding && (
        <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 animate-fade-in-up">
          {fields.map((f) => (
            <div key={f.name} className={f.type === 'text' && f.name === 'title' ? 'sm:col-span-2' : ''}>
              <label className="label">{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="input" required={f.required}>
                  <option value="">Seçiniz…</option>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  placeholder={f.placeholder}
                  className="input"
                  required={f.required}
                  min={f.type === 'number' ? 0 : undefined}
                />
              )}
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end gap-2">
            {error && <span className="text-rose-600 text-xs self-center mr-auto">⚠ {error}</span>}
            <button type="submit" disabled={saving} className="btn-success">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Ekleniyor…' : 'Ekle'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-400 inline-flex items-center justify-center gap-2 w-full">
          <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.id} className={`p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all animate-fade-in-up ${itemLayout === 'block' ? 'block' : 'flex items-center gap-3'}`} style={{ animationDelay: `${idx * 40}ms` }}>
              {itemLayout === 'row' ? (
                <>
                  {renderItem(it)}
                  <button onClick={() => onDelete(it.id)} className="btn-icon hover:!border-rose-300 hover:!text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  {renderItem(it)}
                  <button onClick={() => onDelete(it.id)} className="btn-icon hover:!border-rose-300 hover:!text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="label inline-flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </span>
      {children}
    </label>
  );
}
