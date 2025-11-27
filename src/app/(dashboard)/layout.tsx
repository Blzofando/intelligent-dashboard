"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import ChatWidget from '@/components/ChatWidget';
import PrivateRoute from '@/components/PrivateRoute';
import { CourseProvider } from '@/context/CourseProvider';
import { useProfileStore } from '@/store/useProfileStore';
import Image from 'next/image';
import { BarChart3, BookOpen, Calendar, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/config/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const courseId = params?.courseId as string | undefined;

  const { profile, isLoadingProfile, clearProfile } = useProfileStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearProfile();

    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const navItems = React.useMemo(() => {
    type NavItem = {
      path: string;
      icon: React.ElementType;
      label: string;
      isSubItem?: boolean;
    };

    const items: NavItem[] = [
      { path: "/", icon: LayoutDashboard, label: "Meus Cursos" },
    ];

    if (courseId) {
      items.push(
        { path: `/courses/${courseId}`, icon: BarChart3, label: "Painel do Curso" },
        { path: `/courses/${courseId}/modules`, icon: BookOpen, label: "Módulos", isSubItem: true }
      );
    }

    items.push(
      { path: "/planner", icon: Calendar, label: "Meu Calendário" },
      { path: "/profile", icon: User, label: "Perfil" }
    );

    return items;
  }, [courseId]);

  return (
    <PrivateRoute>
      <CourseProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">

          {/* Sidebar */}
          <aside className={`absolute inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col shadow-lg`}>

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
                    : pathname === item.path || pathname.startsWith(item.path + '/');

                  const Icon = item.icon;
                  // @ts-ignore
                  const isSubItem = item.isSubItem;

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`group flex items-center gap-3 px-4 ${isSubItem ? 'py-2 pl-8' : 'py-2.5'} rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className={`flex items-center justify-center ${isActive
                        ? 'bg-blue-700'
                        : 'group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                        } ${isSubItem ? 'p-1' : 'p-1.5'} rounded-md transition-colors duration-200`}>
                        <Icon className={`${isSubItem ? 'w-4 h-4' : 'w-5 h-5'}`} strokeWidth={isActive ? 2 : 1.5} />
                      </div>
                      <span className={`text-sm ${isActive ? 'font-medium' : ''} ${isSubItem ? 'text-xs' : ''}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Botão de Logout */}
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

          </aside>

          {/* Main content */}
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
        </div >
      </CourseProvider >
    </PrivateRoute >
  );
}