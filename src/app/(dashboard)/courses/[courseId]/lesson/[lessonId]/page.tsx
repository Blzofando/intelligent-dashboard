"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCourseContext } from '@/context/CourseProvider';
import VideoPlayer from '@/components/VideoPlayer';
import { CheckCircle, BookOpen, ChevronRight, ChevronLeft, Download, Sparkles, PlayCircle } from 'lucide-react';
import { Lesson, Module } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

type FlatLesson = Lesson & { moduleId: string; moduleTitle: string };

const LessonPlayerPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  const courseId = params.courseId as string;

  const { course, completedLessons, toggleLessonCompleted } = useCourseContext();

  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  const { lesson, module, nextLesson, previousLesson } = useMemo(() => {
    if (!course) return { lesson: null, module: null, nextLesson: null, previousLesson: null };

    const allLessons: FlatLesson[] = course.modules.flatMap(mod =>
      mod.lessons.map(les => ({
        ...les,
        moduleId: mod.id,
        moduleTitle: mod.title
      }))
    );
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) {
      return { lesson: null, module: null, nextLesson: null, previousLesson: null };
    }
    const currentLesson = allLessons[currentIndex];
    const currentModule = course.modules.find(m => m.id === currentLesson.moduleId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    return {
      lesson: currentLesson as Lesson,
      module: currentModule || null,
      nextLesson: nextLesson,
      previousLesson: prevLesson
    };
  }, [lessonId, course]);

  const isCompleted = completedLessons.has(lessonId);

  const handleComplete = () => {
    if (!isCompleted) {
      toggleLessonCompleted(lessonId);
      setShowCompletionMessage(true);
      setTimeout(() => setShowCompletionMessage(false), 3000);
    }
  };

  const goToNextLesson = () => {
    if (nextLesson) {
      router.push(`/courses/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const goToPreviousLesson = () => {
    if (previousLesson) {
      router.push(`/courses/${courseId}/lesson/${previousLesson.id}`);
    }
  };

  if (!course) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-300 animate-pulse">Carregando curso...</div>;
  }

  if (!lesson || !module) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando aula...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
        <Link href={`/courses/${courseId}/modules`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Módulos
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <Link
          href={`/courses/${courseId}/module/${module.id}`}
          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {module.title}
        </Link>
        <ChevronRight className="w-4 h-4 shrink-0" />
        <span className="text-gray-800 dark:text-white font-medium truncate max-w-[200px] md:max-w-none">{lesson.title}</span>
      </nav>

      {/* Cabeçalho da Aula */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white leading-tight">
              {lesson.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                <BookOpen className="w-4 h-4 text-primary-500" />
                {module.title}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Concluída
                </span>
              )}
            </div>
          </div>

          {!isCompleted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className="w-full md:w-auto px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Marcar como Concluída
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {showCompletionMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-200 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold">Parabéns! Aula concluída com sucesso! 🎉</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Player de Vídeo */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl overflow-hidden shadow-2xl bg-black"
      >
        <VideoPlayer
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          onComplete={handleComplete}
        />
      </motion.div>

      {/* Navegação entre Aulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previousLesson ? (
          <Link
            href={`/courses/${courseId}/lesson/${previousLesson.id}`}
            className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-md"
          >
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Aula Anterior</p>
              <p className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {previousLesson.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="hidden md:block"></div>
        )}

        {nextLesson ? (
          <Link
            href={`/courses/${courseId}/lesson/${nextLesson.id}`}
            className="group flex items-center justify-end gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all hover:shadow-md text-right"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Próxima Aula</p>
              <p className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {nextLesson.title}
              </p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
              <ChevronRight className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </Link>
        ) : (
          <Link
            href={`/courses/${courseId}/modules`}
            className="group flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
          >
            <span className="font-bold text-green-700 dark:text-green-400">Voltar aos Módulos</span>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </Link>
        )}
      </div>

      {/* Área de Recursos */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary-500" />
          Recursos da Aula
        </h2>
        <div className="space-y-3">
          {lesson.materialUrl ? (
            <a
              href={lesson.materialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
            >
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">Baixar Materiais da Aula</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clique para fazer o download do arquivo (.zip)</p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-600 dark:text-gray-300">Material de Apoio</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum material complementar disponível para esta aula.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LessonPlayerPage;