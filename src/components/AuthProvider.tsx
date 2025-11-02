"use client";

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore'; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setLoadingAuth } = useAuthStore();
  const { fetchProfile, clearProfile } = useProfileStore(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário LOGOU
        setUser(user);
        fetchProfile(user.uid); 
      } else {
        // Usuário DESLOGOU
        setUser(null);
        clearProfile(); // Limpa o perfil
      }
      
      // --- A CORREÇÃO ESTÁ AQUI ---
      // Esta linha foi movida para fora do 'else'
      // Agora, o carregamento do Auth SEMPRE termina.
      setLoadingAuth(false); 
      // --- FIM DA CORREÇÃO ---

    });

    return () => unsubscribe();
  }, [setUser, setLoadingAuth, fetchProfile, clearProfile]);

  return <>{children}</>;
};