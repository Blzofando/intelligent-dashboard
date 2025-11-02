"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCourseContext } from '@/context/CourseProvider';
import VideoPlayer from '@/components/VideoPlayer'; // Importa o seu player
import { CheckCircle, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { Lesson, Module } from '@/types'; // Importa nossos tipos

// 1. CORREÇÃO: Definimos um tipo para a "aula achatada" que usamos para navegação
type FlatLesson = Lesson & { moduleId: string; moduleTitle: string };

const LessonPlayerPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;
  
  const { course, completedLessons, toggleLessonCompleted } = useCourseContext();
  
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // 2. CORREÇÃO: O useMemo foi totalmente reescrito para ser limpo e à prova de erros
  const { lesson, module, nextLesson, previousLesson } = useMemo(() => {
    // Achatamos todas as aulas em um único array com infos do módulo
    const allLessons: FlatLesson[] = course.modules.flatMap(mod => 
      mod.lessons.map(les => ({
        ...les,
        moduleId: mod.id,
        moduleTitle: mod.title
      }))
    );

    // Encontramos o índice da aula atual
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);

    // Se não encontrar, retorna nulo para tudo
    if (currentIndex === -1) {
      return { lesson: null, module: null, nextLesson: null, previousLesson: null };
    }

    // Se encontrar, pega tudo
    const currentLesson = allLessons[currentIndex];
    // O 'module' é do tipo Module, mas 'currentLesson' é FlatLesson (que também é uma Lesson)
    const currentModule = course.modules.find(m => m.id === currentLesson.moduleId); 
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return {
      lesson: currentLesson as Lesson, // Trata como Lesson base
      module: currentModule || null,
      nextLesson: nextLesson,
      previousLesson: prevLesson
    };
  }, [lessonId, course]);
  // --- FIM DA CORREÇÃO ---

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
      router.push(`/lesson/${nextLesson.id}`);
    }
  };

  const goToPreviousLesson = () => {
    if (previousLesson) {
      router.push(`/lesson/${previousLesson.id}`);
    }
  };

  // Esta verificação agora funciona, corrigindo os erros 'never'
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/course" className="hover:text-primary-600 dark:hover:text-primary-400">
          Módulos
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link 
          href={`/module/${module.id}`} 
          className="hover:text-primary-600 dark:hover:text-primary-400"
        >
          {module.title}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 dark:text-white font-medium">{lesson.title}</span>
      </div>

      {/* Cabeçalho da Aula */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {module.title}
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Concluída
                </span>
              )}
            </div>
          </div>

          {!isCompleted && (
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Marcar como Concluída
            </button>
          )}
        </div>

        {showCompletionMessage && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Parabéns! Aula concluída! 🎉</span>
            </div>
          </div>
        )}
      </div>

      {/* Player de Vídeo (Seu novo componente) */}
      <VideoPlayer 
        lessonId={lesson.id} // Passa "F001"
        lessonTitle={lesson.title}
        onComplete={handleComplete}
      />

      {/* Navegação entre Aulas */}
      <div className="flex items-center justify-between gap-4">
        {previousLesson ? (
          <button
            onClick={goToPreviousLesson}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Anterior</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {previousLesson.title.substring(0, 30)}...
              </p>
            </div>
          </button>
        ) : (
          <div></div> // Espaçador
        )}

        {nextLesson ? (
          <button
            onClick={goToNextLesson}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-all"
          >
            <div className="text-right">
              <p className="text-xs text-primary-100">Próxima</p>
              <p className="font-semibold">
                {nextLesson.title.substring(0, 30)}...
              </p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <Link
            href="/course"
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all"
          >
            🎉 Voltar aos Módulos
          </Link>
        )}
      </div>

      {/* Área de Recursos (Placeholder) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Recursos da Aula
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <i className="fas fa-file-pdf text-primary-600 dark:text-primary-400"></i>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Material de Apoio</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayerPage;