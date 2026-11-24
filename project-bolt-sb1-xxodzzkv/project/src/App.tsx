import { useEffect, useRef, useState } from 'react';
import { Menu, PanelLeftOpen, SquarePen } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useChat } from '@/hooks/useChat';

export default function App() {
  const {
    conversations,
    activeConversation,
    activeId,
    isTyping,
    newConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    deleteMessage,
    editMessage,
    sendMessage,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation?.messages ?? [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isTyping]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out`}
      >
        <div className="h-full w-72 border-r border-white/5">
          <Sidebar
            conversations={conversations}
            activeId={activeId}
            onNew={newConversation}
            onSelect={(id) => {
              selectConversation(id);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            onDelete={deleteConversation}
            onRename={renameConversation}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-white/5 px-3">
          {!sidebarOpen ? (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                title="Open sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  newConversation();
                  setSidebarOpen(true);
                }}
                className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
                title="New chat"
              >
                <SquarePen className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
              title="Close sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 truncate text-center text-sm font-medium text-slate-300">
            {activeConversation?.title ?? 'New Chat'}
          </div>
          <button
            onClick={() => {
              newConversation();
              setSidebarOpen(true);
            }}
            className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            title="New chat"
          >
            <SquarePen className="h-5 w-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onPick={(prompt) => sendMessage(prompt)} />
          ) : (
            <div className="mx-auto max-w-3xl py-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onDelete={(msgId) => activeId && deleteMessage(activeId, msgId)}
                  onRename={(msgId, content) => activeId && editMessage(activeId, msgId, content)}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}
