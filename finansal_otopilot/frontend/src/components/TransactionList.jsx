import { ShoppingCart, UtensilsCrossed, Bus, Cpu, Wallet, TrendingUp, Home, Sparkles, Receipt, Zap, Tv, Music } from 'lucide-react';

const ICON_MAP = {
  market: ShoppingCart, yemek: UtensilsCrossed, ulaşım: Bus, ulasim: Bus,
  yakıt: Zap, yakit: Zap, teknoloji: Cpu, maaş: Wallet, maas: Wallet,
  yatırım: TrendingUp, yatirim: TrendingUp, kira: Home, fatura: Home,
  abonelik: Tv, eğlence: Music, eglence: Music,
};
const pickIcon = (cat = '') => ICON_MAP[cat.toLowerCase().trim()] || Sparkles;

const formatTRY = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n || 0);
const formatDate = (d) => { try { return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }); } catch { return d; } };

export default function TransactionList({ transactions = [], loading = false }) {
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <section data-tour="transactions" className="soft-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-display font-bold text-slate-900">Son İşlemler</p>
            <p className="text-xs text-slate-500">Güncel finansal hareketlerin</p>
          </div>
        </div>
        <button className="btn-ghost text-xs">Tümünü Gör</button>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left font-semibold px-2 py-2">Açıklama</th>
              <th className="text-left font-semibold px-2 py-2 hidden sm:table-cell">Kategori</th>
              <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Tarih</th>
              <th className="text-right font-semibold px-2 py-2">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={4} className="text-center text-slate-400 py-8">Yükleniyor…</td></tr>)}
            {!loading && sorted.length === 0 && (<tr><td colSpan={4} className="text-center text-slate-400 py-8">Henüz işlem yok.</td></tr>)}
            {sorted.map((t, i) => {
              const Icon = pickIcon(t.category);
              const isIncome = t.type === 'income';
              return (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isIncome ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <Icon className={`w-4 h-4 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{t.description || t.category}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{t.category} · {formatDate(t.date)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 hidden sm:table-cell">
                    <span className="chip">{t.category}</span>
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell text-slate-500">{formatDate(t.date)}</td>
                  <td className={`px-2 py-3 text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'} {formatTRY(t.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
