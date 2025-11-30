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
import { clsx } from 'clsx';

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
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden">

          {/* Mobile Overlay - Escurece e desfoca o fundo quando o sidebar está aberto */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden transition-all duration-300"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col glass-panel dark:glass-panel-dark m-4 rounded-2xl shadow-2xl md:shadow-none`}>

            <div className="flex flex-col flex-1 overflow-hidden">

              {/* Logo Header */}
              <div className="flex items-center justify-center h-24 border-b border-gray-200/20 dark:border-gray-700/30">
                <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg shadow-primary-500/30 animate-[pulse-glow_3s_infinite]">
                    <i className="fas fa-brain text-white text-lg"></i>
                  </div>
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-primary-600 to-secondary-500 dark:from-primary-400 dark:to-secondary-400 animate-[fade-in_1s_ease-out]">
                    LearnAI
                  </span>
                </h1>
              </div>

              {/* Itens de Navegação */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
                {navItems.map((item, index) => {
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
                      style={{ animationDelay: `${index * 100}ms` }}
                      className={clsx(
                        "group flex items-center gap-3 px-4 rounded-xl transition-all duration-300 animate-[slide-up_0.5s_ease-out_backwards]",
                        isSubItem ? 'py-2 pl-8' : 'py-3',
                        isActive
                          ? item.label === "Módulos"
                            ? "bg-linear-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                            : "bg-linear-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-[1.02]"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:scale-[1.02] hover:shadow-sm"
                      )}
                    >
                      <div className={clsx(
                        "flex items-center justify-center rounded-lg transition-colors duration-200",
                        isActive ? 'bg-white/20' : 'group-hover:bg-primary-50 dark:group-hover:bg-gray-600/50',
                        isSubItem ? 'p-1' : 'p-2'
                      )}>
                        <Icon className={`${isSubItem ? 'w-4 h-4' : 'w-5 h-5'}`} strokeWidth={isActive ? 2.5 : 1.5} />
                      </div>
                      <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'} ${isSubItem ? 'text-xs' : ''}`}>{item.label}</span>

                      {isActive && (
                        <div className={clsx(
                          "ml-auto w-1.5 h-1.5 rounded-full animate-pulse",
                          item.label === "Módulos" ? "bg-yellow-400" : "bg-white"
                        )} />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Botão de Logout */}
            <div className="p-4 border-t border-gray-200/20 dark:border-gray-700/30">
              <button
                onClick={handleLogout}
                className={`group flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm`}
              >
                <div className="flex items-center justify-center p-2 rounded-lg transition-colors duration-200 group-hover:bg-red-100 dark:group-hover:bg-red-800/30">
                  <LogOut className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>

          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between h-20 px-8 bg-transparent z-10">
              <button
                className="md:hidden p-2 text-gray-500 glass-panel rounded-lg"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Open sidebar"
              >
                <i className="fas fa-bars"></i>
              </button>
              <div className="flex-1"></div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/profile" className="flex items-center gap-3 group glass-panel dark:glass-panel-dark px-3 py-1.5 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
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
                  <span className="hidden md:block text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 pr-2">
                    {profile?.displayName}
                  </span>
                </Link>
              </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
              {/* Background Blobs */}
              <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-[float_8s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-[120px] animate-[float_10s_ease-in-out_infinite_reverse]"></div>
              </div>

              {children}
            </main>
          </div>

          <ChatWidget />
        </div>
      </CourseProvider>
    </PrivateRoute>
  );
}