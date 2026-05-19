import { useEffect, useState } from 'react';
import { ArrowRight, X, Sparkles, User, MessageSquare, Plus, BarChart3, Target, History } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Finansal Otopilot\'a Hoş Geldin! 👋',
    body: 'Ben Niko, senin yapay zekâ destekli finans asistanın. Önce kısa bir tur atalım, sonra profil bilgilerini doldurarak bütçeni optimize edelim.',
    icon: Sparkles,
    target: null,
    placement: 'center',
  },
  {
    id: 'niko',
    title: '1. Niko · AI Asistanın',
    body: 'Sağdaki Niko chat ekranı, doğal dilde harcamalarını, hedeflerini ve sorularını paylaşabileceğin ana yer. Hatta sesli görüşme bile destekliyor!',
    icon: MessageSquare,
    target: '[data-tour="niko"]',
    placement: 'left',
  },
  {
    id: 'fab',
    title: '2. Hızlı İşlem Butonu',
    body: 'Sağ alttaki + butonu ile metin, ses veya fiş fotoğrafıyla anında işlem ekleyebilirsin. Gemini AI gerisini halleder.',
    icon: Plus,
    target: '[data-tour="fab"]',
    placement: 'top-left',
  },
  {
    id: 'insight',
    title: '3. Ajan Tavsiyesi',
    body: 'Niko harcamalarını analiz edip sana bütçeni koruman için özel ve akıllı tavsiyelerde bulunur.',
    icon: Target,
    target: '[data-tour="insight"]',
    placement: 'bottom',
  },
  {
    id: 'chart',
    title: '4. Grafikler & Analizler',
    body: 'Son 7 gün harcama ve yatırım trendini buradan canlı izleyebilirsin. Her yeni işlemde grafikler anlık güncellenir.',
    icon: BarChart3,
    target: '[data-tour="chart"]',
    placement: 'bottom',
  },
  {
    id: 'transactions',
    title: '5. Son İşlemler',
    body: 'Tüm harcama ve gelir geçmişini buradan detaylıca takip edebilirsin.',
    icon: History,
    target: '[data-tour="transactions"]',
    placement: 'top',
  },
  {
    id: 'profile',
    title: '6. Profil & Hedefler',
    body: 'Profil sayfasından abonelik, sabit gider ve finansal hedeflerini ekleyebilirsin. Niko bunlara göre özel tavsiye verir.',
    icon: User,
    target: '[data-tour="profile-nav"]',
    placement: 'bottom',
  },
];

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const current = STEPS[step];

  useEffect(() => {
    if (!current.target) { setRect(null); return; }
    const update = () => {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else setRect(null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const id = setInterval(update, 250);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearInterval(id);
    };
  }, [current.target]);

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose?.();
  };
  const prev = () => step > 0 && setStep(step - 1);

  // Tooltip konumu hesapla
  const tipStyle = (() => {
    if (!rect || current.placement === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const pad = 16;
    const w = 360;
    let top, left;
    switch (current.placement) {
      case 'left':
        top = Math.max(20, rect.top + rect.height / 2 - 120);
        left = Math.max(20, rect.left - w - pad);
        break;
      case 'top-left':
        top = Math.max(20, rect.top - 220);
        left = Math.max(20, rect.left + rect.width - w);
        break;
      case 'top':
        top = Math.max(20, rect.top - 240); // Tooltip'in yüksekliği kadar yukarı
        left = Math.max(20, Math.min(window.innerWidth - w - 20, rect.left + rect.width / 2 - w / 2));
        break;
      case 'bottom':
        top = rect.top + rect.height + pad;
        left = Math.max(20, Math.min(window.innerWidth - w - 20, rect.left));
        break;
      default:
        top = rect.top + rect.height + pad;
        left = Math.max(20, Math.min(window.innerWidth - w - 20, rect.left + rect.width / 2 - w / 2));
    }
    return { top, left, width: w };
  })();

  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in-up">
      {/* Spotlight overlay (zorunlu — dış tıklama kapatmaz) */}
      {rect ? (
        <div
          className="fixed transition-all duration-500 ease-out pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 18,
            boxShadow: '0 0 0 4px rgba(16,185,129,0.55), 0 0 0 9999px rgba(15,23,42,0.65)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm" />
      )}

      {/* Click catcher — dışa tıklamayı engelle (zorunlu tur) */}
      <div className="absolute inset-0 cursor-not-allowed" onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <div
        className="fixed z-[101] transition-all duration-300 ease-out"
        style={tipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-strong p-5 animate-scale-in w-full h-full">
          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-glow-violet flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold">
                Adım {step + 1} / {STEPS.length}
              </p>
              <p className="font-display font-bold text-slate-900 mt-0.5">{current.title}</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{current.body}</p>

          {/* Progress dots */}
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-gradient-to-r from-indigo-500 to-violet-500' : i < step ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400 italic">
              {step === STEPS.length - 1 ? 'Tur tamamlandı 🎉' : 'Tüm adımları tamamla'}
            </p>
            <div className="flex gap-2">
              {step > 0 && <button onClick={prev} className="btn-secondary !py-2">Geri</button>}
              <button onClick={next} className="btn-primary !py-2">
                {step === STEPS.length - 1 ? 'Başla!' : 'İleri'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
