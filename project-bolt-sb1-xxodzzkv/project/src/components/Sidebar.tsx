import { useEffect, useRef, useState } from 'react';
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/types';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onClose,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setDraft(conv.title);
  };

  const saveRename = () => {
    if (editingId) {
      onRename(editingId, draft.trim() || 'Untitled');
    }
    setEditingId(null);
  };

  const grouped = conversations.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const date = new Date(conv.updatedAt);
    const now = new Date();
    let key: string;
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) key = 'Today';
    else if (diffDays === 1) key = 'Yesterday';
    else if (diffDays < 7) key = 'Previous 7 days';
    else key = 'Older';
    (acc[key] ??= []).push(conv);
    return acc;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/95 backdrop-blur">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-200">Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            No conversations yet. Start a new chat to begin.
          </div>
        ) : (
          groupOrder.map((group) =>
            grouped[group] ? (
              <div key={group} className="mb-3">
                <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {group}
                </div>
                {grouped[group].map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative mb-0.5 flex items-center rounded-lg transition-colors ${
                      conv.id === activeId
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex w-full items-center px-2 py-1.5">
                        <input
                          ref={inputRef}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={saveRename}
                          className="w-full rounded border border-emerald-500/50 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelect(conv.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                        >
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-slate-500" />
                          <span className="truncate text-sm text-slate-300">{conv.title}</span>
                        </button>
                        <div className="flex items-center pr-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startRename(conv)}
                            className="rounded p-1 text-slate-500 hover:text-slate-200"
                            title="Rename"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(conv.id)}
                            className="rounded p-1 text-slate-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : null
          )
        )}
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            U
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-200">You</div>
            <div className="truncate text-xs text-slate-500">Free plan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
