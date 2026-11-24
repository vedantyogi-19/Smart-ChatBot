import { useEffect, useRef, useState } from 'react';
import { ArrowUp, SquarePen } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-800/80 shadow-lg backdrop-blur focus-within:border-emerald-500/40">
        <SquarePen className="ml-3.5 mt-3.5 h-5 w-5 flex-shrink-0 text-slate-500" />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Message Assistant…"
          rows={1}
          className="flex-1 resize-none bg-transparent py-3.5 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          style={{ maxHeight: '200px' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="mb-2 mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-600">
        Assistant can make mistakes. Check important info.
      </p>
    </div>
  );
}
