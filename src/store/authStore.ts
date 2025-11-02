import { create } from 'zustand';
import { User } from 'firebase/auth'; 

interface AuthState {
  user: User | null;
  isLoadingAuth: boolean; // Renomeado de 'isLoading' para 'isLoadingAuth'
  setUser: (user: User | null) => void;
  setLoadingAuth: (loading: boolean) => void; // Renomeado de 'setLoading'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,       
  isLoadingAuth: true,  // Renomeado
  setUser: (user) => set({ user }),
  setLoadingAuth: (loading) => set({ isLoadingAuth: loading }), // Renomeado
}));
