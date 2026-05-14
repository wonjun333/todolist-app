import { create } from 'zustand';
import type { User } from '../types/user.types';

interface AuthState {
  accessToken: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setCurrentUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  currentUser: null,
  isAuthenticated: false,
  setToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  setCurrentUser: (user) => set({ currentUser: user }),
  logout: () => set({ accessToken: null, currentUser: null, isAuthenticated: false }),
}));
