"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { courses } from '@/data/courses';
import { BookOpen, ArrowRight, Sparkles, Trophy, Clock, Star } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function AllCoursesPage() {
  const { profile } = useProfileStore();
  const [typedText, setTypedText] = useState('');
  const fullText = profile?.displayName
    ? ` -Olá, ${profile.displayName.split(' ')[0]}... Pronto para evoluir?`
    : "Bem-vindo ao futuro do aprendizado...";

  useEffect(() => {
    let index = 0;
    setTypedText('');
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [fullText]);

  // Helper function to calculate progress
  const getCourseProgress = (courseId: string, modules: any[]) => {
    if (!profile?.completedLessons) return 0;

    const courseLessonIds = new Set(modules.flatMap(m => m.lessons.map((l: any) => l.id)));
    const completedCount = profile.completedLessons.filter(id => courseLessonIds.has(id)).length;
    const totalLessons = courseLessonIds.size;

    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">

      {/* Hero Section com Typing Effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-900/80 to-secondary-900/80 p-8 md:p-12 border border-white/10 shadow-2xl backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-primary-200 mb-4 backdrop-blur-sm"
          >
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>Painel Inteligente</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 min-h-14 md:min-h-16 px-1">
            <span className="bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400">
              {typedText}
            </span>
            <span className="animate-blink border-r-4 border-primary-400 ml-1"></span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-lg text-gray-300 max-w-2xl"
          >
            Selecione um curso abaixo para continuar sua jornada de conhecimento.
          </motion.p>
        </div>
      </motion.div>

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, index) => {
          const progress = getCourseProgress(course.id, course.modules);

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
            >
              <Link
                href={`/courses/${course.slug}`}
                className="group relative flex flex-col h-full bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 backdrop-blur-sm"
              >
                {/* Imagem com Overlay */}
                <div className="aspect-video relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge de Progresso na Imagem */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border border-white/10",
                      progress === 100 ? "bg-green-500/90 text-white" : "bg-black/60 text-white"
                    )}>
                      {progress === 100 ? <Trophy className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{progress}%</span>
                    </div>
                  </div>

                  {/* Botão Flutuante */}
                  <div className="absolute bottom-4 right-4 z-20 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-600/40 hover:bg-primary-500 hover:scale-110 transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6 flex-1 flex flex-col relative">
                  {/* Barra de Progresso Fina no Topo do Card */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={clsx(
                        "h-full transition-all duration-300",
                        progress === 100 ? "bg-green-500" : "bg-linear-to-r from-primary-500 to-secondary-500"
                      )}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2 mt-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 flex-1">
                    {course.description || "Acesse o conteúdo completo deste curso e domine novas habilidades."}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-4 h-4 text-primary-500" />
                      <span>{course.modules.length} Módulos</span>
                    </div>

                    <div className="flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                      <span>Acessar</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
