import { useEffect, useState } from 'react';
import { Sparkles, Check, X, Bot, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../api.js';

const FALLBACK = {
  insight_text: "Bu ay yemek harcamalarına %15 oranında bütçe ayırmışsın. Bir kısmını yatırıma kaydırmak avantajlı olabilir.",
  action_suggested: 'Yemek bütçesini %50 azalt, US100 endeksine 500 TL aktar',
};

export default function AIInsightCard({ refreshKey = 0 }) {
  const [status, setStatus] = useState('pending');
  const [insight, setInsight] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = async () => {
    setLoading(true); setStatus('pending');
    try {
      const res = await api.getInsight();
      if (res?.data?.insight_text) { setInsight(res.data); setLive(true); }
    } catch { setLive(false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [refreshKey]);

  return (
    <div data-tour="insight" className="soft-card gradient-border p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
        {/* Sol — Insight metni */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-glow-violet animate-float-soft flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs uppercase tracking-widest text-violet-700 font-bold">Ajan Tavsiyesi</p>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> {insight.is_welcome ? 'Karşılama' : (live ? 'Canlı' : 'Demo')}
              </span>
              <button onClick={load} disabled={loading} title="Yenile" className="ml-auto btn-icon !w-7 !h-7">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed text-sm min-h-[60px]">
              {loading ? (
                <span className="text-slate-400 inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Niko düşünüyor…
                </span>
              ) : insight.insight_text}
            </p>
          </div>
        </div>

        {/* Sağ — Aksiyon kutusu */}
        <div className="relative">
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-start gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1">Önerilen Aksiyon</p>
                <p className="text-sm text-slate-700 leading-snug">{loading ? '…' : insight.action_suggested}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {status === 'pending' && !insight.is_welcome && (
                <>
                  <button onClick={() => setStatus('accepted')} disabled={loading} className="btn-success flex-1 !py-2 text-xs">
                    <Check className="w-3.5 h-3.5" /> Onayla
                  </button>
                  <button onClick={() => setStatus('rejected')} disabled={loading} className="btn-secondary !py-2 text-xs">
                    <X className="w-3.5 h-3.5" /> Sonra
                  </button>
                </>
              )}
              {status === 'accepted' && (
                <div className="w-full text-center py-2 rounded-lg bg-white/80 border border-emerald-300 text-emerald-700 font-semibold text-xs inline-flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Talimat oluşturuldu ✓
                </div>
              )}
              {status === 'rejected' && (
                <div className="w-full text-center py-2 rounded-lg bg-white/80 border border-slate-200 text-slate-500 text-xs">
                  Tavsiye ertelendi
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
