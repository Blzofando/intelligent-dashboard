"use client";

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { LogOut, Clock, Brain } from 'lucide-react';

const WaitingApprovalPage = () => {
  const { clearProfile } = useProfileStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearProfile();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 text-center relative overflow-hidden">
        {/* Background blobs for premium feel */}
        <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-40 h-40 bg-secondary-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-linear-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Brain className="text-white w-10 h-10" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-md animate-pulse">
                <Clock className="text-white w-5 h-5" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary-600 to-secondary-500 dark:from-primary-400 dark:to-secondary-400 mb-2">
            Aguardando Aprovação
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Olá! Sua conta foi criada com sucesso, mas para manter a qualidade e segurança da nossa plataforma, 
            um administrador precisa aprovar seu acesso manualmente.
          </p>

          <div className="space-y-4">
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Fique tranquilo! Você receberá um e-mail assim que seu acesso for liberado.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-red-300 dark:hover:border-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair desta conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingApprovalPage;
