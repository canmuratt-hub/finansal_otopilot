import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

const dayLabel = (d) => {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return days[new Date(d).getDay()];
};

export default function TrendChart({ transactions = [] }) {
  const data = useMemo(() => {
    const today = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ key, label: dayLabel(d), harcama: 0, yatirim: 0 });
    }
    const map = Object.fromEntries(buckets.map((b) => [b.key, b]));
    transactions.forEach((t) => {
      const k = (t.date || '').slice(0, 10);
      if (!map[k]) return;
      const amt = Number(t.amount) || 0;
      if (t.type === 'expense') map[k].harcama += amt;
      else map[k].yatirim += amt;
    });
    return buckets;
  }, [transactions]);

  return (
    <div className="soft-card p-5 sm:p-6 h-full" data-tour="chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-display font-bold text-slate-900">Son 7 Gün Trendi</p>
            <p className="text-xs text-slate-500">Harcama & yatırım hareketleri</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Harcama
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Yatırım
          </span>
        </div>
      </div>

      <div className="h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-invest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(15,23,42,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={50}
              tickFormatter={(v) => `${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`} />
            <Tooltip
              contentStyle={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,0.1)' }}
              labelStyle={{ color: '#0f172a', fontWeight: 700 }}
              formatter={(v, name) => [new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v), name]}
            />
            <Area type="monotone" dataKey="harcama" name="Harcama" stroke="#f43f5e" strokeWidth={2.5} fill="url(#grad-expense)" activeDot={{ r: 5, stroke: '#f43f5e', strokeWidth: 2, fill: '#fff' }} />
            <Area type="monotone" dataKey="yatirim" name="Yatırım" stroke="#10b981" strokeWidth={2.5} fill="url(#grad-invest)" activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
