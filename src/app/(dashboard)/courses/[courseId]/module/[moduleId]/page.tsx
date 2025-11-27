"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCourseContext } from '@/context/CourseProvider';
import { generateSummary, generateFlashcards, generatePbixChallenge } from '@/services/geminiService';
import { Flashcard } from '@/types';
// IMPORT DO PbixQuiz (componente separado)
import PbixQuiz from '@/components/PbixQuiz';

const ModuleDetail: React.FC = () => {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const courseId = params.courseId as string;
  const { course, completedLessons, toggleLessonCompleted, notes, updateNote } = useCourseContext();

  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState({ summary: false, quiz: false, flashcards: false });

  // ESTADOS ATUALIZADOS
  const [showPbixQuiz, setShowPbixQuiz] = useState(false);
  const [files, setFiles] = useState<any[]>([]); // Para os Excels (recebidos da API)
  const [tasks, setTasks] = useState<any[]>([]); // Para as Tarefas (com ajuda e gabarito)

  const module = useMemo(() => course?.modules.find(m => m.id === moduleId), [course, moduleId]);

  const completedInModule = useMemo(() => {
    if (!module) return 0;
    return module.lessons.filter(l => completedLessons.has(l.id)).length;
  }, [module, completedLessons]);

  const isModuleCompleted = module ? completedInModule === module.lessons.length : false;

  // HANDLERS: sempre checar se module existe dentro do handler (TypeScript não consegue estreitar em async)
  const handleGenerateSummary = async () => {
    if (!module) return;
    setShowPbixQuiz(false);
    setFiles([]);
    setTasks([]);
    setIsLoading(prev => ({ ...prev, summary: true }));

    const lessonTitles = module.lessons.map(l => l.title);
    try {
      const result = await generateSummary(module.title, lessonTitles);
      setSummary(result);
    } catch (err) {
      console.error("Erro ao gerar resumo:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const handleGenerateQuiz = async () => {
    if (!module) return;
    setSummary('');
    setFlashcards([]);
    setShowPbixQuiz(false);
    setIsLoading(prev => ({ ...prev, quiz: true }));

    const lessonTitles = module.lessons.map(l => l.title);
    try {
      // A API agora retorna { files, tasks }
      const result = await generatePbixChallenge(module.title, lessonTitles);

      console.log("Resultado da API:", result); // Debug

      if (result && Array.isArray(result.files) && Array.isArray(result.tasks)) {
        setFiles(result.files);
        setTasks(result.tasks);
        setShowPbixQuiz(true);
      } else {
        console.error("Erro: A API não retornou o JSON de desafio esperado.", result);
      }
    } catch (error) {
      console.error("Erro ao chamar o serviço de quiz:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, quiz: false }));
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!module) return;
    setShowPbixQuiz(false);
    setFiles([]);
    setTasks([]);
    setIsLoading(prev => ({ ...prev, flashcards: true }));
    const lessonTitles = module.lessons.map(l => l.title);
    try {
      const result = await generateFlashcards(module.title, lessonTitles);
      setFlashcards(result);
    } catch (err) {
      console.error("Erro ao gerar flashcards:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, flashcards: false }));
    }
  };

  if (!course) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-300">Carregando curso...</div>;
  }

  if (!module) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Módulo não encontrado</h1>
        <Link href={`/courses/${courseId}/modules`} className="text-primary-500 hover:underline mt-4 inline-block">Voltar para o curso</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bloco de Links e Título */}
      <Link href={`/courses/${courseId}/modules`} className="text-primary-500 hover:underline">&larr; Voltar para os Módulos</Link>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{module.title}</h1>

      {/* Bloco de Aulas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Aulas</h2>
        <ul className="space-y-3">
          {module.lessons.map(lesson => (
            <li key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <Link href={`/courses/${courseId}/lesson/${lesson.id}`} className="flex-1">
                <span className={`${completedLessons.has(lesson.id) ? 'line-through text-gray-500' : ''}`}>
                  {lesson.title}
                </span>
              </Link>
              <button
                onClick={() => toggleLessonCompleted(lesson.id)}
                className={`ml-4 px-3 py-1 text-sm rounded-full shrink-0 ${completedLessons.has(lesson.id)
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

      {/* Bloco de Anotações */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Anotações do Módulo</h2>
        <textarea
          value={notes[module.id] || ''}
          onChange={e => updateNote(module.id, e.target.value)}
          placeholder="Escreva suas anotações aqui..."
          className="w-full h-32 p-2 border rounded-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-hidden focus:ring-3 focus:ring-primary-500"
        />
      </div>

      {/* Bloco de Conclusão do Módulo (Onde tudo acontece) */}
      {isModuleCompleted && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
          <h2 className="text-2xl font-bold text-center text-green-600">Parabéns, você completou o módulo!</h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Utilize as ferramentas de IA abaixo para revisar e fixar o seu aprendizado.
          </p>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={handleGenerateSummary} disabled={isLoading.summary} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
              {isLoading.summary ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-file-alt text-2xl"></i>}
              <span className="mt-2">Gerar Resumo</span>
            </button>
            <button onClick={handleGenerateQuiz} disabled={isLoading.quiz} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
              {isLoading.quiz ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-question-circle text-2xl"></i>}
              <span className="mt-2">Gerar Atividade Prática</span>
            </button>
            <button onClick={handleGenerateFlashcards} disabled={isLoading.flashcards} className="p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 flex flex-col items-center">
              {isLoading.flashcards ? <i className="fas fa-spinner fa-spin text-2xl"></i> : <i className="fas fa-clone text-2xl"></i>}
              <span className="mt-2">Gerar Flashcards</span>
            </button>
          </div>

          {/* Área de Resultados */}
          {summary && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
              <h3 className="font-bold mb-2">Resumo:</h3>
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          )}
          {flashcards.length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Flashcards:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map((card, index) => (
                  <div key={index} className="group perspective-[1000px]">
                    <div className="relative h-32 w-full rounded-xl shadow-xl transition-all duration-500 transform-3d group-hover:rotate-y-180">
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-xl p-4 backface-hidden">
                        <p className="text-center font-semibold">{card.front}</p>
                      </div>
                      <div className="absolute inset-0 h-full w-full rounded-xl bg-primary-500 dark:bg-primary-700 px-4 text-center text-slate-200 rotate-y-180 backface-hidden flex items-center justify-center">
                        <p>{card.back}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATIVIDADE PRÁTICA (O NOVO COMPONENTE) */}
          {showPbixQuiz && (
            <div className="p-4 bg-gray-900 rounded-xl shadow-lg mt-6">
              <PbixQuiz
                tasks={tasks}
                files={files}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleDetail;
