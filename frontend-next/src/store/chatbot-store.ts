import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type ChatbotStore = {
  messages: ChatMessage[];
  isAuthenticated: boolean;
  userEmail: string | null;
  awaitingPassword: boolean;
  tempEmail: string | null;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setAuthenticated: (email: string) => void;
  resetAuth: () => void;
  setAwaitingPassword: (email: string) => void;
  clearAwaitingPassword: () => void;
};

export const useChatbotStore = create<ChatbotStore>((set) => ({
  messages: [],
  isAuthenticated: false,
  userEmail: null,
  awaitingPassword: false,
  tempEmail: null,
  addMessage: (message) => set((state) => {
    if (state.messages.find(m => m.id === message.id)) return state;
    return { messages: [...state.messages, message] };
  }),
  clearMessages: () => set({ messages: [] }),
  setAuthenticated: (email) => set({ isAuthenticated: true, userEmail: email, awaitingPassword: false, tempEmail: null }),
  resetAuth: () => set({ isAuthenticated: false, userEmail: null, messages: [], awaitingPassword: false, tempEmail: null }),
  setAwaitingPassword: (email) => set({ awaitingPassword: true, tempEmail: email }),
  clearAwaitingPassword: () => set({ awaitingPassword: false, tempEmail: null }),
}));
