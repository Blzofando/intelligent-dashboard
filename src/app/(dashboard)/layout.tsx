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
import { BarChart3, BookOpen, Calendar, User } from 'lucide-react'; // Ícones mais limpos

// --- ATUALIZADO (Ícones e Nomes) ---
const navItems = [
  { path: "/", icon: BarChart3, label: "Dashboard" },
  { path: "/course", icon: BookOpen, label: "Módulos" }, // Renomeado
  { path: "/planner", icon: Calendar, label: "Meu Calendário" }, // Renomeado
  { path: "/profile", icon: User, label: "Perfil" }, 
];
// --- FIM DA ATUALIZAÇÃO ---

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname(); 
  const { profile, isLoadingProfile } = useProfileStore();

  return (
    <PrivateRoute>
      <CourseProvider> 
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          {/* Sidebar */}
          <aside className={`absolute inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col shadow-lg`}>
            <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                <i className="fas fa-brain mr-2"></i>LearnAI
              </h1>
            </div>
            <nav className="flex-1 px-4 py-8 space-y-2">
              {navItems.map(item => {
                // --- LÓGICA DE DESTAQUE ATUALIZADA ---
                // Verifica se a rota atual começa com o path do item
                // Ex: /module/module-1 (pathname) começa com /course (item.path)
                const isActive = item.path === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(item.path);
                
                const Icon = item.icon; 

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    // --- ATUALIZAÇÃO DE ESTILO ---
                    className={`relative flex items-center px-4 py-3 rounded-lg transition-colors duration-200 font-medium ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg' // Destaque forte
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {/* Barra lateral de destaque */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-white rounded-r-full"></span>
                    )}
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="ml-4">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <button 
                className="md:hidden p-2 text-gray-500" // Cor adicionada
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
            {/* Cor de fundo da área principal */}
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

