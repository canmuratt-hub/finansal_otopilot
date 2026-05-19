import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      data-tour="fab"
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Hızlı işlem ekle"
    >
      <span className="absolute inset-0 rounded-full bg-indigo-400/30 blur-xl group-hover:bg-indigo-400/50 transition-all" />
      <span className="absolute inset-0 rounded-full animate-pulse-dot" />
      <span className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-indigo-500/40 border-2 border-white group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
        <Plus className="w-7 h-7 text-white" strokeWidth={3} />
      </span>
      <span className="absolute right-16 top-1/2 -translate-y-1/2 hidden group-hover:flex bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg">
        Hızlı İşlem Ekle
      </span>
    </button>
  );
}
