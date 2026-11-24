import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation, Message } from '@/types';

const STORAGE_KEY = 'chatbot-conversations';

const RESPONSES = [
  "That's a great question. Let me break this down for you step by step so it's easy to follow.",
  "I can definitely help with that. Here's what I'd recommend based on best practices and common patterns.",
  "Interesting topic! There are a few angles to consider here, and I'll walk you through each one.",
  "Absolutely. Here's a clear explanation along with some practical examples you can apply right away.",
  "Good thinking. Let me share a structured approach that should give you exactly what you need.",
  "Sure thing. I'll outline the key points and then dive deeper into the parts that matter most to you.",
  "Here's my take on this — I'll keep it concise but cover the essentials so you can move forward confidently.",
  "Let me give you a thorough answer. First, the short version, then the details for when you need them.",
];

function generateResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase().trim();
  if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
    return "Hello! I'm your AI assistant. I can help you brainstorm ideas, answer questions, draft content, explain concepts, and much more. What would you like to explore today?";
  }
  if (lower.includes('thank')) {
    return "You're very welcome! Feel free to ask me anything else whenever you need a hand.";
  }
  if (lower.includes('who are you') || lower.includes('what are you')) {
    return "I'm a conversational AI assistant designed to help you with a wide range of tasks — from answering questions to helping you think through complex problems. Think of me as your always-available thinking partner.";
  }
  const base = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
  return `${base}\n\nYou mentioned: "${userMessage}". I'd be happy to go deeper on any part of this — just let me know which direction you'd like to take it.`;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    /* ignore quota errors */
  }
}

function titleFromMessage(content: string): string {
  const trimmed = content.trim().replace(/\n+/g, ' ');
  return trimmed.length > 40 ? trimmed.slice(0, 40) + '…' : trimmed || 'New Chat';
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const loaded = loadConversations();
    return loaded.length > 0 ? loaded[0].id : null;
  });
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const newConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (id === activeId) {
          setActiveId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeId]
  );

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: title.trim() || 'Untitled' } : c))
    );
  }, []);

  const deleteMessage = useCallback((convId: string, msgId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.filter((m) => m.id !== msgId), updatedAt: Date.now() }
          : c
      )
    );
  }, []);

  const editMessage = useCallback((convId: string, msgId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, content } : m
              ),
              updatedAt: Date.now(),
            }
          : c
      )
    );
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isTyping) return;

      const userMessage: Message = {
        id: uid(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setConversations((prev) => {
        let conv = prev.find((c) => c.id === activeId);
        if (!conv) {
          conv = {
            id: uid(),
            title: titleFromMessage(content),
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveId(conv.id);
          return [{ ...conv, messages: [userMessage], updatedAt: Date.now() }, ...prev];
        }
        return prev.map((c) =>
          c.id === conv!.id
            ? {
                ...c,
                title: c.messages.length === 0 ? titleFromMessage(content) : c.title,
                messages: [...c.messages, userMessage],
                updatedAt: Date.now(),
              }
            : c
        );
      });

      setIsTyping(true);

      const responseText = generateResponse(content);
      const responseDelay = 600 + Math.min(responseText.length * 8, 1200);

      typingTimeout.current = setTimeout(() => {
        const assistantMessage: Message = {
          id: uid(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId || (activeId === null && c.messages.some((m) => m.id === userMessage.id))
              ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: Date.now() }
              : c
          )
        );
        setIsTyping(false);
      }, responseDelay);
    },
    [activeId, isTyping]
  );

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  return {
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
  };
}
