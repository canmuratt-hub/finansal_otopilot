import { Wallet, TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatTRY = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n || 0);

export default function SummaryCards({ transactions = [] }) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const investBudget = Math.max(income * 0.2, 0);

  const cards = [
    { title: 'Toplam Bakiye', value: formatTRY(balance), delta: '+12.4%', up: true, icon: Wallet,
      grad: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', ring: 'ring-indigo-100' },
    { title: 'Aylık Harcama', value: formatTRY(expense), delta: '-3.1%', up: false, icon: TrendingDown,
      grad: 'from-rose-500 to-orange-500', iconBg: 'bg-rose-50', iconColor: 'text-rose-600', ring: 'ring-rose-100' },
    { title: 'Yatırım Bütçesi', value: formatTRY(investBudget), delta: '+8.7%', up: true, icon: TrendingUp,
      grad: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', ring: 'ring-emerald-100' },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="soft-card p-5 relative overflow-hidden group cursor-default animate-fade-in-up hover:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${c.grad} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{c.title}</p>
                <p className="text-3xl font-display font-extrabold mt-2 tracking-tight text-slate-900">{c.value}</p>
                <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${c.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {c.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {c.delta}
                  <span className="text-slate-400 font-normal ml-1">son 30 gün</span>
                </div>
              </div>
              <div className={`w-11 h-11 rounded-xl ${c.iconBg} ring-1 ${c.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
