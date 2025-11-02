"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname(); 

  const { user, isLoadingAuth } = useAuthStore(); // Carregamento do Login
  const { profile, isLoadingProfile } = useProfileStore(); // Carregamento do Perfil

  // Verifica se o perfil básico (onboarding) foi concluído
  const isProfileComplete = profile && profile.displayName !== "Novo Aluno";
  
  // O carregamento GERAL (spinner) só termina quando AMBOS terminarem
  const isLoading = isLoadingAuth || isLoadingProfile; 

  useEffect(() => {
    if (isLoading) {
      return; // Não faça nada enquanto tudo carrega
    }

    // 1. Se não há usuário, mande para o login
    if (!user) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    // 2. Se HÁ usuário, mas o perfil está INCOMPLETO
    if (user && !isProfileComplete) {
      // Se ele já não estiver na página de boas-vindas, force-o para lá
      if (pathname !== '/welcome') {
        router.push('/welcome');
      }
      return;
    }

    // 3. Se HÁ usuário E o perfil está COMPLETO
    if (user && isProfileComplete) {
      // Se ele estiver tentando acessar /login ou /welcome, mande-o para o dashboard
      if (pathname === '/login' || pathname === '/welcome') {
        router.push('/');
      }
      return;
    }

  }, [user, isLoading, isProfileComplete, pathname, router]);

  // --- Lógica de Renderização ---

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <i className="fas fa-spinner fa-spin text-4xl text-primary-500"></i>
      </div>
    );
  }

  // RENDERIZA A PÁGINA CORRETA
  // Se logado E completo E não estiver em /login ou /welcome...
  if (user && isProfileComplete && pathname !== '/login' && pathname !== '/welcome') {
    return <>{children}</>; // Mostra o Dashboard
  }
  // Se logado E incompleto E na página /welcome...
  if (user && !isProfileComplete && pathname === '/welcome') {
    return <>{children}</>; // Mostra a página de Onboarding
  }
  // Se deslogado E na página /login...
  if (!user && pathname === '/login') {
    return <>{children}</>; // Mostra a página de Login
  }
  
  // Qualquer outro caso (ex: logado, completo, mas em /login),
  // o useEffect está redirecionando, então não renderiza nada.
  return null; 
};

export default PrivateRoute; // <-- A linha que estava faltando!

