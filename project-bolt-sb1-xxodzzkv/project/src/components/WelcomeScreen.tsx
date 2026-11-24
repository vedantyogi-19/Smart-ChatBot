import { Sparkles } from 'lucide-react';

interface Suggestion {
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: '✦',
    title: 'Explain a concept',
    subtitle: 'Break down a complex topic in simple terms',
    prompt: 'Explain how machine learning works in simple terms.',
  },
  {
    icon: '✎',
    title: 'Draft an email',
    subtitle: 'Write a professional message for any occasion',
    prompt: 'Help me write a professional email to schedule a meeting.',
  },
  {
    icon: '◈',
    title: 'Brainstorm ideas',
    subtitle: 'Generate creative ideas for your next project',
    prompt: 'Brainstorm five creative ideas for a mobile app.',
  },
  {
    icon: '⌘',
    title: 'Get advice',
    subtitle: 'Get a structured recommendation on anything',
    prompt: 'What are the best practices for learning a new programming language?',
  },
];

interface Props {
  onPick: (prompt: string) => void;
}

export function WelcomeScreen({ onPick }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-slate-100 sm:text-3xl">
        How can I help you today?
      </h1>
      <p className="mb-8 text-center text-sm text-slate-500">
        Ask me anything, or try one of these suggestions to get started.
      </p>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onPick(s.prompt)}
            className="group flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-emerald-500/30 hover:bg-white/[0.05]"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg text-emerald-400">{s.icon}</span>
              <span className="text-sm font-semibold text-slate-200">{s.title}</span>
            </div>
            <span className="text-sm text-slate-500">{s.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
