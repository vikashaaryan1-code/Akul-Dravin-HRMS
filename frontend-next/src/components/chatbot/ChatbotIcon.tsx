'use client';

import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { ChatbotWindow } from './ChatbotWindow';

export function ChatbotIcon() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ember to-amber text-white shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Open chatbot"
        title="Ask me anything about the platform"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}
    </>
  );
}
