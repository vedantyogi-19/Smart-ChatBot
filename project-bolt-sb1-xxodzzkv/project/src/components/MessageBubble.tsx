import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Pencil, Trash2 } from 'lucide-react';
import type { Message } from '@/types';

interface Props {
  message: Message;
  onDelete: (id: string) => void;
  onRename: (id: string, content: string) => void;
}

export function MessageBubble({ message, onDelete, onRename }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUser = message.role === 'user';

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveEdit = () => {
    onRename(message.id, draft.trim() || message.content);
    setEditing(false);
  };

  return (
    <div className={`group flex gap-3 px-4 py-5 sm:px-6 ${isUser ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
      <div className="flex-shrink-0">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
            isUser
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 text-emerald-400 ring-1 ring-white/10'
          }`}
        >
          {isUser ? 'You' : 'AI'}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">
            {isUser ? 'You' : 'Assistant'}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === 'Escape') {
                  setDraft(message.content);
                  setEditing(false);
                }
              }}
              className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
              rows={1}
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDraft(message.content);
                  setEditing(false);
                }}
                className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">
            {message.content}
          </div>
        )}

        {!editing && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {isUser && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button
              onClick={() => onDelete(message.id)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
