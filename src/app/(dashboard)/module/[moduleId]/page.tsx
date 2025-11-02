// src/app/(dashboard)/module/[moduleId]/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation'; // CORRIGIDO
import Link from 'next/link'; // CORRIGIDO
import { useCourseContext } from '@/context/CourseProvider'; // <-- MUDANÇA AQUI
import { generateSummary, generateQuiz, generateFlashcards } from '@/services/geminiService'; // CORRIGIDO
import { QuizQuestion, Flashcard } from '@/types'; // CORRIGIDO
import QuizModal from '@/components/Quiz'; // CORRIGIDO

const ModuleDetail: React.FC = () => {
  const params = useParams(); // CORRIGIDO
  const moduleId = params.moduleId as string; // CORRIGIDO

  const { course, completedLessons, toggleLessonCompleted, notes, updateNote } = useCourseContext(); // <-- MUDANÇA AQUI
  
  const [summary, setSummary] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState({ summary: false, quiz: false, flashcards: false });
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  
  const module = useMemo(() => course.modules.find(m => m.id === moduleId), [course, moduleId]);
  
  const completedInModule = useMemo(() => {
    if (!module) return 0;
    return module.lessons.filter(l => completedLessons.has(l.id)).length;
  }, [module, completedLessons]);
  
  const isModuleCompleted = module ? completedInModule === module.lessons.length : false;

  const handleGenerateSummary = async () => {
    if (!module) return;
    setIsLoading(prev => ({ ...prev, summary: true }));
    const lessonTitles = module.lessons.map(l => l.title);
    const result = await generateSummary(module.title, lessonTitles);
    setSummary(result);
    setIsLoading(prev => ({ ...prev, summary: false }));
  };

  const handleGenerateQuiz = async () => {
    if (!module) return;
    setIsLoading(prev => ({ ...prev, quiz: true }));
    const lessonTitles = module.lessons.map(l => l.title);
    const result = await generateQuiz(module.title, lessonTitles);
    setQuiz(result);
    setIsLoading(prev => ({ ...prev, quiz: false }));
    if (result.length > 0) setIsQuizModalOpen(true);
  };

  const handleGenerateFlashcards = async () => {
    if (!module) return;
    setIsLoading(prev => ({ ...prev, flashcards: true }));
    const lessonTitles = module.lessons.map(l => l.title);
    const result = await generateFlashcards(module.title, lessonTitles);
    setFlashcards(result);
    setIsLoading(prev => ({ ...prev, flashcards: false }));
  };

  if (!module) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Módulo não encontrado</h1>
        <Link href="/course" className="text-primary-500 hover:underline mt-4 inline-block">Voltar para o curso</Link> {/* CORRIGIDO: usa 'href' */}
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Link href="/course" className="text-primary-500 hover:underline">&larr; Voltar para os Módulos</Link> {/* CORRIGIDO: usa 'href' */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{module.title}</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Aulas</h2>
          <ul className="space-y-3">
              {module.lessons.map(lesson => (
                  <li key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <Link href={`/lesson/${lesson.id}`} className="flex-1">
                      <span className={`${completedLessons.has(lesson.id) ? 'line-through text-gray-500' : ''}`}>
                        {lesson.title}
                      </span>
                    </Link>
                    <button 
                      onClick={() => toggleLessonCompleted(lesson.id)} 
                      className={`ml-4 px-3 py-1 text-sm rounded-full shrink-0 ${
                        completedLessons.has(lesson.id) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {completedLessons.has(lesson.id) ? '✓' : 'Marcar'}
                    </button>
                  </li>
              ))}
          </ul>
      </div>
      
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Anotações do Módulo</h2>
           <textarea
              value={notes[module.id] || ''}
              onChange={e => updateNote(module.id, e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="w-full h-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
      </div>

      {isModuleCompleted && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
              <h2 className="text-2xl font-bold text-center text-green-600">Parabéns, você completou o módulo!</h2>
              <p className="text-center text-gray-600 dark:text-gray-400">Utilize as ferramentas de IA abaixo para revisar e fixar o seu aprendizado.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={handleGenerateSummary} disabled={isLoading.summary} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
                      {isLoading.summary ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-file-alt text-2xl"></i>}
                      <span className="mt-2">Gerar Resumo</span>
                  </button>
                  <button onClick={handleGenerateQuiz} disabled={isLoading.quiz} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
                      {isLoading.quiz ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-question-circle text-2xl"></i>}
                      <span className="mt-2">Gerar Quiz</span>
                  </button>
                  <button onClick={handleGenerateFlashcards} disabled={isLoading.flashcards} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
                      {isLoading.flashcards ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-clone text-2xl"></i>}
                      <span className="mt-2">Gerar Flashcards</span>
                  </button>
              </div>

              {summary && <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg"><h3 className="font-bold mb-2">Resumo:</h3><p className="whitespace-pre-wrap">{summary}</p></div>}
              
              {flashcards.length > 0 && (
                  <div>
                      <h3 className="font-bold mb-2">Flashcards:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {flashcards.map((card, index) => (
                              <div key={index} className="group perspective-[1000px]"> {/* <-- CORRIGIDO */}
                                <div className="relative h-32 w-full rounded-xl shadow-xl transition-all duration-500 transform-3d group-hover:rotate-y-180"> {/* <-- CORRIGIDO */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-xl p-4 backface-hidden">
                                        <p className="text-center font-semibold">{card.front}</p>
                                    </div>
                                    <div className="absolute inset-0 h-full w-full rounded-xl bg-primary-500 dark:bg-primary-700 px-4 text-center text-slate-200 rotate-y-180 backface-hidden flex items-center justify-center"> {/* <-- CORRIGIDO */}
                                        <p>{card.back}</p>
                                    </div>
                                </div>
                            </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}
       <QuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} questions={quiz} />
    </div>
  );
};

export default ModuleDetail; 