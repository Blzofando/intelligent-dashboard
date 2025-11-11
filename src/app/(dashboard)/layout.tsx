"use client"; 

import React, { useState } from 'react';
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 
import { ThemeToggle } from '@/components/ThemeToggle'; 
import ChatWidget from '@/components/ChatWidget';
import PrivateRoute from '@/components/PrivateRoute';
import { CourseProvider } from '@/context/CourseProvider';
import { useProfileStore } from '@/store/useProfileStore'; 
import Image from 'next/image'; 

// --- 1. IMPORTAR ÍCONES E FUNÇÕES DE LOGOUT ---
import { BarChart3, BookOpen, Calendar, User, LogOut } from 'lucide-react'; // Adicionado LogOut
import { useRouter } from 'next/navigation';
import { auth } from '@/config/firebaseConfig';
import { signOut } from 'firebase/auth';
// --- FIM DA IMPORTAÇÃO ---

const navItems = [
  { path: "/", icon: BarChart3, label: "Dashboard" },
  { path: "/course", icon: BookOpen, label: "Módulos" },
  { path: "/planner", icon: Calendar, label: "Meu Calendário" },
  { path: "/profile", icon: User, label: "Perfil" }, 
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname(); 
  
  // --- 2. ADICIONAR HOOKS E A FUNÇÃO DE LOGOUT ---
  const { profile, isLoadingProfile, clearProfile } = useProfileStore(); // Pegar o clearProfile
  const router = useRouter(); // Hook de Roteamento

  const handleLogout = async () => {
    try {
      await signOut(auth);    // 1. Desloga do Firebase
      clearProfile();          // 2. Limpa o profile (Zustand)
      router.push('/login');   // 3. Redireciona para o login
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  // --- FIM DA FUNÇÃO ---

  return (
    <PrivateRoute>
      <CourseProvider> 
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          
          {/* Sidebar */}
          <aside className={`absolute inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col shadow-lg`}>
            
            {/* Wrapper para empurrar o logout para baixo */}
            <div className="flex flex-col flex-1 h-0"> 
              
              {/* Logo Header */}
              <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  <i className="fas fa-brain mr-2"></i>LearnAI
                </h1>
              </div>

              {/* Itens de Navegação */}
              <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                {navItems.map(item => {
                  const isActive = item.path === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.path);
                  
                  const Icon = item.icon; 

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`flex items-center justify-center ${
                        isActive 
                          ? 'bg-blue-700' 
                          : 'group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                      } p-1.5 rounded-md transition-colors duration-200`}>
                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                      </div>
                      <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* --- 3. BOTÃO DE LOGOUT ADICIONADO --- */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className={`group flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400`}
              >
                <div className="flex items-center justify-center p-1.5 rounded-md transition-colors duration-200 group-hover:bg-red-100 dark:group-hover:bg-red-800/50">
                  <LogOut className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <span className="text-sm">Sair</span>
              </button>
            </div>
            {/* --- FIM DO BOTÃO --- */}

          </aside>

          {/* Main content (sem alterações) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button 
                className="md:hidden p-2 text-gray-500"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
              <div className="flex-1"></div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/profile" className="flex items-center gap-2 group">
                  {isLoadingProfile ? (
                    <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                  ) : (
                    <Image
                      src={profile?.avatarPath || "/avatars/outros/o-01.png"}
                      alt="Avatar do usuário"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all"
                    />
                  )}
                  <span className="hidden md:block text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {profile?.displayName}
                  </span>
                </Link>
              </div>
            </header>
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
              {children} 
            </main>
          </div>

          <ChatWidget />
        </div>
      </CourseProvider>
    </PrivateRoute>
  );
}