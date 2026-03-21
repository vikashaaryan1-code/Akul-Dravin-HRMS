'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useChatbotStore } from '@/store/chatbot-store';

type ChatbotWindowProps = {
  onClose: () => void;
};

export function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, isAuthenticated, awaitingPassword, tempEmail, setAuthenticated, setAwaitingPassword, clearAwaitingPassword } = useChatbotStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Send welcome message on first load
    if (messages.length === 0) {
      addMessage({
        id: `welcome-${Date.now()}`,
        text: "Hello! 👋 Welcome to AKUL DRAVIN HRMS. Please enter your email address to continue.",
        sender: 'bot',
        timestamp: new Date(),
      });
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user' as const,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      let response = '';

      if (!isAuthenticated) {
        if (!awaitingPassword) {
          // Check if input is email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(userInput)) {
            setAwaitingPassword(userInput);
            response = "Great! Now please enter your password.";
          } else {
            response = "Please enter a valid email address first to continue.";
          }
        } else {
          // User entered password
          if (userInput.length >= 6) {
            setAuthenticated(tempEmail!);
            response = `Welcome ${tempEmail}! 🎉 You're now authenticated. I can help you with questions about our platform features, navigation, and more. What would you like to know?`;
          } else {
            clearAwaitingPassword();
            response = "Password must be at least 6 characters. Please enter your email again to restart.";
          }
        }
      } else {
        response = getBotResponse(userInput);
      }

      addMessage({
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-ember to-amber p-4 text-white dark:border-slate-700">
        <div>
          <p className="font-semibold">AKUL DRAVIN Assistant</p>
          <p className="text-xs text-white/80">Always here to help</p>
        </div>
        <button
          onClick={onClose}
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/20"
          aria-label="Close chatbot"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="h-80 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-ember to-amber text-white'
                  : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        {!isAuthenticated ? (
          !awaitingPassword ? (
            // Email input box
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your email to continue</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="your@email.com"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-ember to-amber text-white disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            // Password input box
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your password</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="••••••••"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-ember to-amber text-white disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )
        ) : (
          // Authenticated — normal chat input
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-ember to-amber text-white disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getBotResponse(userInput: string): string {
  const input = userInput.toLowerCase();

  // Greetings
  if (/hello|hi|hey|greetings|good morning|good afternoon|good evening/.test(input)) {
    return "Hello! 👋 Welcome to AKUL DRAVIN HRMS. I'm here to help you navigate the platform and answer your questions. What would you like to know?";
  }

  // Dashboard/Navigation
  if (/dashboard|home|main page/.test(input)) {
    return "You can access the Dashboard from the sidebar or click on the AKUL DRAVIN logo. The dashboard shows your key metrics, KPIs, and quick access to important modules.";
  }

  // Employees
  if (/employee|staff|team|workforce/.test(input)) {
    return "The Employees module lets you manage all employee information, including personal details, roles, departments, and more. You can access it from the sidebar navigation.";
  }

  // Payroll
  if (/payroll|salary|compensation|pay|wage/.test(input)) {
    return "The Payroll module handles salary processing, deductions, overtime, and compensation management. You can view payroll reports and process payments from this section.";
  }

  // Recruitment
  if (/recruitment|hire|candidate|job|recruitment/.test(input)) {
    return "The Recruitment module helps you manage job postings, candidates, interviews, and the entire hiring workflow. You can track applicants from application to onboarding.";
  }

  // Attendance
  if (/attendance|check-in|check-out|presence|clock|timesheet/.test(input)) {
    return "The Attendance module tracks employee check-ins, check-outs, and daily presence. You can generate attendance reports and monitor workforce availability.";
  }

  // Leaves
  if (/leave|vacation|holiday|time off|sick leave/.test(input)) {
    return "The Leave module manages employee leave requests, approvals, and tracking. You can set leave policies and maintain leave balances for all employees.";
  }

  // Settings
  if (/settings|preferences|configuration|account/.test(input)) {
    return "The Settings module (available in the sidebar) lets you customize your preferences, manage notifications, toggle dark mode, and configure account settings.";
  }

  // Logout
  if (/logout|sign out|exit|bye|goodbye/.test(input)) {
    return "You can logout by clicking the Logout button at the bottom of the Dashboard page, or by going to Settings and selecting Logout. See you soon!";
  }

  // Notifications
  if (/notification|alert|remind/.test(input)) {
    return "Notifications keep you updated on important events. You can manage notification preferences in Settings to control which alerts you receive.";
  }

  // Help/Support
  if (/help|support|issue|problem|error|bug/.test(input)) {
    return "For support, you can reach out through the Helpdesk module or contact your administrator. If you encounter any issues, please report them through the platform's support system.";
  }

  // Analytics
  if (/analytics|report|data|insight|dashboard/.test(input)) {
    return "The Analytics module provides detailed insights into various HR metrics, employee performance trends, and business analytics. You can generate custom reports from here.";
  }

  // Thank you
  if (/thank|thanks|appreciate|grateful/.test(input)) {
    return "You're welcome! 😊 If you have any more questions, feel free to ask. I'm here to help!";
  }

  // Default response
  return "Great question! 🤔 I can help you with questions about:\n• Dashboard & Navigation\n• Employee Management\n• Payroll & Compensation\n• Recruitment & Hiring\n• Attendance & Leaves\n• Settings & Preferences\n• Analytics & Reports\n\nWhat would you like to know more about?";
}
