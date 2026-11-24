export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-5 sm:px-6">
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-emerald-400 ring-1 ring-white/10">
          AI
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pt-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
        </div>
      </div>
    </div>
  );
}
