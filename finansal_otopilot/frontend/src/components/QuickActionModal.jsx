import { useEffect, useRef, useState } from 'react';
import { X, Camera, Mic, Type, Loader2, CheckCircle2, AlertCircle, Upload, MicOff } from 'lucide-react';
import { api, fileToBase64 } from '../api.js';

const TABS = [
  { id: 'text', label: 'Metin', icon: Type },
  { id: 'voice', label: 'Sesli', icon: Mic },
  { id: 'camera', label: 'Fiş Fotoğrafı', icon: Camera },
];

export default function QuickActionModal({ open, onClose, onSaved }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) {
      setText(''); setResult(null); setError(null); setPreview(null); setRecording(false);
      try { recognitionRef.current?.stop(); } catch {}
    }
  }, [open]);

  if (!open) return null;

  const submitText = async () => {
    if (!text.trim()) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await api.parseText(text.trim());
      setResult(res.saved || res.parsed);
      if (res.saved) onSaved?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Tarayıcın Web Speech API desteklemiyor. Chrome/Edge dene.'); return; }
    const rec = new SR();
    rec.lang = 'tr-TR'; rec.interimResults = true; rec.continuous = false;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText(finalText || interim);
    };
    rec.onerror = (e) => { setError('Mikrofon hatası: ' + e.error); setRecording(false); };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    setError(null); setRecording(true); rec.start();
  };
  const stopVoice = () => { try { recognitionRef.current?.stop(); } catch {}; setRecording(false); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await api.parseReceipt(base64, file.type || 'image/jpeg');
      setResult(res.saved || res.parsed);
      if (res.saved) onSaved?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 btn-icon"><X className="w-4 h-4" /></button>

        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-600 font-bold">Hızlı İşlem</p>
          <h2 className="text-2xl font-display font-bold mt-1 text-slate-900">AI ile İşlem Ekle</h2>
          <p className="text-xs text-slate-500 mt-1">Metin yaz, sesle söyle ya da fişin fotoğrafını yükle. Niko gerisini halleder.</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setResult(null); setError(null); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95
                  ${active ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {tab === 'text' && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Örn: "Dün 500 TL yakıt aldım" veya "Bugün 150 TL döner yedim"'
                rows={3}
                className="input"
              />
              <button onClick={submitText} disabled={busy || !text.trim()} className="btn-primary w-full">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
                {busy ? 'Gemini analiz ediyor…' : 'AI ile Çözümle & Kaydet'}
              </button>
            </>
          )}

          {tab === 'voice' && (
            <>
              <div className="text-center py-6">
                <button
                  onClick={recording ? stopVoice : startVoice}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95
                    ${recording
                      ? 'bg-rose-100 border-2 border-rose-400 shadow-glow-rose'
                      : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 hover:scale-105 hover:shadow-glow-indigo'}`}
                >
                  {recording && <span className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping" />}
                  {recording ? <MicOff className="w-10 h-10 text-rose-600" /> : <Mic className="w-10 h-10 text-indigo-600" />}
                </button>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  {recording ? 'Dinleniyor… (Türkçe)' : 'Mikrofona basıp konuş'}
                </p>
                <p className="text-xs text-slate-500 mt-1">"Bugün marketten 320 TL alışveriş yaptım"</p>
              </div>
              {text && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm">
                  <p className="text-xs text-indigo-700 font-semibold mb-1">Algılanan metin:</p>
                  <p className="text-slate-800">{text}</p>
                </div>
              )}
              <button onClick={submitText} disabled={busy || !text.trim() || recording} className="btn-success w-full">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {busy ? 'AI analiz ediyor…' : 'AI ile Çözümle & Kaydet'}
              </button>
            </>
          )}

          {tab === 'camera' && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
              {!preview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl py-10 flex flex-col items-center gap-3 transition-all hover:bg-indigo-50/50 active:scale-[0.99]"
                >
                  <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">Fiş fotoğrafı yükle</p>
                    <p className="text-xs text-slate-500 mt-1">Kameradan çek veya galeriden seç</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={preview} alt="Fiş" className="w-full max-h-64 object-contain bg-slate-50" />
                    {busy && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-sm font-medium text-slate-700">Gemini Vision fişi okuyor…</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setPreview(null); setResult(null); setError(null); }} className="w-full text-xs text-slate-500 hover:text-slate-700 py-2">
                    Başka bir fiş yükle
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm animate-fade-in-up">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-rose-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="font-bold text-emerald-700">İşlem otomatik kaydedildi!</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Tutar:</span> <span className="font-semibold text-slate-900">{Number(result.amount).toLocaleString('tr-TR')} TL</span></div>
                <div><span className="text-slate-500">Tip:</span> <span className="font-semibold text-slate-900">{result.type === 'income' ? 'Gelir' : 'Harcama'}</span></div>
                <div><span className="text-slate-500">Kategori:</span> <span className="font-semibold text-slate-900">{result.category}</span></div>
                <div><span className="text-slate-500">Tarih:</span> <span className="font-semibold text-slate-900">{result.date}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Açıklama:</span> <span className="text-slate-800">{result.description}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
