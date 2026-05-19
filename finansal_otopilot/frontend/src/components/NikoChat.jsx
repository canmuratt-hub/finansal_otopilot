import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Mic, MicOff, Loader2, Volume2, VolumeX, Sparkles, User as UserIcon } from 'lucide-react';
import { api } from '../api.js';

const WELCOME = "Finansal Otopilot'a hoş geldin! 👋 Seni daha iyi tanıyabilmem ve bütçeni optimize edebilmem için lütfen önce 'Profil' kısmından kayıt seçeneklerini, aboneliklerini ve hedeflerini doldur. Ya da doğrudan bana bir ses kaydı at veya harcama fişini yükle, gerisini ben hallederim!";

// Türkçe için en iyi sesi seç
const pickTurkishVoice = () => {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  return voices.find((v) => v.lang === 'tr-TR' && /natural|premium|enhanced|google/i.test(v.name))
      || voices.find((v) => v.lang.startsWith('tr'))
      || voices.find((v) => /google/i.test(v.name))
      || voices[0]
      || null;
};

const speak = (text, voiceRef) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Emoji ve markdown'ı temizle
  const clean = String(text)
    .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\*\*/g, '').replace(/[`*_]/g, '').trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  const v = voiceRef.current || pickTurkishVoice();
  if (v) { u.voice = v; voiceRef.current = v; }
  u.lang = 'tr-TR';
  u.rate = 1.15;   // Akıcı insan hızı
  u.pitch = 1.05;
  u.volume = 1;
  window.speechSynthesis.speak(u);
};

export default function NikoChat({ onActionsExecuted }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const voiceRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Bazı tarayıcılarda voices async yüklenir
    const sync = () => { voiceRef.current = pickTurkishVoice(); };
    sync();
    window.speechSynthesis?.addEventListener?.('voiceschanged', sync);
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', sync);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: message }];
    setMessages(newMsgs);
    setBusy(true);
    try {
      // Geçmişi hazırla — Gemini ilk mesajın 'user' olmasını şart koşar.
      // Welcome dahil baştaki tüm assistant mesajlarını at.
      let history = newMsgs.slice(-12, -1);
      while (history.length && history[0].role !== 'user') history.shift();
      const res = await api.chatNiko(message, history);
      const reply = res.reply || 'Anlayamadım, tekrar söyler misin?';
      setMessages((m) => [...m, { role: 'assistant', content: reply, actions: res.actions_executed || [] }]);
      if (res.actions_executed?.length) onActionsExecuted?.(res.actions_executed);
      if (voiceMode) speak(reply, voiceRef);
    } catch (e) {
      const raw = String(e?.message || '');
      let friendly;
      if (/quota|429|rate ?limit|exceeded/i.test(raw)) {
        friendly = '🌬️ Şu an çok yoğunum, biraz nefes alayım. 30 saniye sonra tekrar dener misin?';
      } else if (/fetch|network|failed/i.test(raw)) {
        friendly = '📡 Sunucuya ulaşamıyorum. Bağlantını kontrol edip tekrar dener misin?';
      } else {
        friendly = 'Üzgünüm, beklenmedik bir aksilik oldu. Tekrar dener misin?';
      }
      setMessages((m) => [...m, { role: 'assistant', content: friendly }]);
      if (voiceMode) speak(friendly, voiceRef);
    } finally { setBusy(false); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Tarayıcın sesli komutu desteklemiyor. Chrome/Edge dene.'); return; }
    window.speechSynthesis?.cancel();
    const rec = new SR();
    rec.lang = 'tr-TR'; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript;
      if (text) send(text);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    setRecording(true);
    rec.start();
  };
  const stopVoice = () => { try { recognitionRef.current?.stop(); } catch {}; setRecording(false); };

  const toggleVoice = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    if (!next) window.speechSynthesis?.cancel();
    else speak('Sesli görüşme açık. Beni dinleyebilirsin.', voiceRef);
  };

  return (
    <div className="soft-card gradient-border p-0 flex flex-col h-[640px] relative overflow-hidden" data-tour="niko">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-glow-violet animate-float-soft">
          <Bot className="w-5 h-5 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse-dot" />
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-slate-900 flex items-center gap-1.5 text-lg tracking-wide">
            NİKO
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Canlı
            </span>
          </p>
          <p className="text-xs text-slate-500">Kişisel AI finans asistanın · Gemini powered</p>
        </div>
        <button
          onClick={toggleVoice}
          title={voiceMode ? 'Sesli görüşmeyi kapat' : 'Sesli görüşmeyi aç'}
          className={`btn-icon ${voiceMode ? '!bg-emerald-50 !border-emerald-300 !text-emerald-600' : ''}`}
        >
          {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center
              ${m.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white'}`}>
              {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
                ${m.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-tr-sm shadow-md'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                {m.content}
              </div>
              {m.actions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.actions.map((a, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      <Sparkles className="w-3 h-3" /> {a.type === 'add_transaction' ? `İşlem eklendi: ${a.data?.amount} TL` : a.type === 'add_goal' ? `Hedef eklendi: ${a.data?.title}` : a.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2.5 animate-fade-in-up">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 rounded-tl-sm">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="relative border-t border-slate-100 p-3 flex items-center gap-2 bg-white/60 backdrop-blur-sm">
        <button
          onClick={recording ? stopVoice : startVoice}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90
            ${recording
              ? 'bg-rose-500 text-white shadow-glow-rose animate-pulse'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
          title={recording ? 'Durdur' : 'Sesle konuş'}
        >
          {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={recording ? 'Dinleniyor…' : 'Niko ile konuş… "Bugün 200 TL döner yedim"'}
          disabled={busy || recording}
          className="input !py-3"
        />
        <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-primary !px-3.5 !py-3">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
