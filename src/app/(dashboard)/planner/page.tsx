"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { StudyPlannerModal } from '@/components/StudyPlannerModal';
import { StudyPlanDay, StudyPlan, StudySettings, UserProfile } from '@/types';
import { BookOpen, CheckCircle, Target, Trophy, Loader2, CalendarDays, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { courses } from '@/data/courses';

// Tipagem
import type { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value'];

// Funções de Data
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
function formatDisplayDate(dateString: string): string {
  if (!dateString) return "N/D";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

const PlannerPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { user } = useAuthStore();
  const {
    profile, // <-- Perfil completo
    isLoadingProfile,
    updateStudyPlan,
    isGeneratingPlan,
    setGeneratingPlan,
  } = useProfileStore();

  const completedLessons = useMemo(() => new Set(profile?.completedLessons || []), [profile]);

  // Agrega todos os planos de curso
  const allPlans = useMemo(() => {
    if (!profile?.coursePlans) return [];
    return Object.values(profile.coursePlans);
  }, [profile]);

  const hasAnyPlan = allPlans.length > 0;

  // Handler de Reorganização (Simplificado para MVP - idealmente reorganizaria por curso)
  // Por enquanto, vamos desabilitar a reorganização global automática até ter suporte no backend
  /*
  const handleReorganizePlan = useCallback(async (profileArg: UserProfile, settingsArg: StudySettings) => {
    // ... Lógica de reorganização precisaria ser adaptada para múltiplos planos ...
  }, [user, updateStudyPlan, setGeneratingPlan]);
  */

  // useEffect principal (mostra modal ou popup)
  useEffect(() => {
    if (isLoadingProfile) return;
    // Se não tem NENHUM plano, abre o modal para criar o primeiro
    if (!hasAnyPlan && !isModalOpen && !isGeneratingPlan) {
      setIsModalOpen(true);
    }
  }, [profile, isLoadingProfile, hasAnyPlan, isModalOpen, isGeneratingPlan]);

  // handler do calendário
  const handleCalendarChange = (value: Value) => {
    const maybe = Array.isArray(value) ? value[0] : value;
    if (!maybe) return;
    const newDate = (typeof maybe === 'string') ? new Date(maybe) : maybe;
    setSelectedDate(newDate);
  };

  // lessonsForSelectedDay - Agregado de todos os planos
  const lessonsForSelectedDay = useMemo(() => {
    const dateString = formatDate(selectedDate);
    const lessons: any[] = [];

    allPlans.forEach(coursePlan => {
      const dayPlan = coursePlan.plan.plan.find(day => day.date === dateString);
      if (dayPlan) {
        lessons.push(...dayPlan.lessons);
      }
    });

    return lessons.length > 0 ? lessons : undefined;
  }, [allPlans, selectedDate]);

  // lessonsTodayCount - Agregado
  const lessonsTodayCount = useMemo(() => {
    const dateString = formatDate(new Date());
    let count = 0;
    allPlans.forEach(coursePlan => {
      const dayPlan = coursePlan.plan.plan.find(day => day.date === dateString);
      if (dayPlan) count += dayPlan.lessons.length;
    });
    return count;
  }, [allPlans]);

  // Próxima conclusão prevista (a mais próxima entre todos os planos)
  const nextCompletionDate = useMemo(() => {
    if (!hasAnyPlan) return "N/D";
    const dates = allPlans.map(p => p.plan.expectedCompletionDate).sort();
    return formatDisplayDate(dates[0]);
  }, [allPlans, hasAnyPlan]);


  return (
    <div className="space-y-8 animate-[fade-in_0.5s_ease-out]">
      {/* 1. AULAS DO DIA (Topo) */}
      <div className="glass-panel dark:glass-panel-dark p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-primary-500" />
          <span>Aulas de <span className="text-primary-600 dark:text-primary-400">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></span>
        </h1>

        {lessonsForSelectedDay ? (
          <div className="mt-6 space-y-6">
            {(() => {
              // Agrupa as aulas por curso
              const lessonsByCourse: Record<string, any[]> = {};
              lessonsForSelectedDay.forEach(lesson => {
                // Tenta pegar o courseId da aula, ou infere pelo prefixo se não tiver
                let cId = lesson.courseId;
                if (!cId) {
                  if (lesson.id.startsWith('pbi-')) cId = 'power-bi';
                  else if (lesson.id.startsWith('lic-')) cId = 'lic';
                  else cId = 'unknown';
                }
                if (!lessonsByCourse[cId]) lessonsByCourse[cId] = [];
                lessonsByCourse[cId].push(lesson);
              });

              return Object.entries(lessonsByCourse).map(([courseId, lessons]) => {
                let course = courses.find(c => c.id === courseId);

                // Fallback para encontrar o curso se o ID mudou (ex: lic-course -> lic)
                if (!course && courseId === 'lic-course') {
                  course = courses.find(c => c.slug === 'lic');
                }

                const courseTitle = course?.title || "Curso";
                // Usa o slug se disponível, senão o ID (que pode ser o antigo ou inferido)
                const courseUrlPart = course?.slug || courseId;

                return (
                  <div key={courseId} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border-l-4 border-primary-500">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-500" />
                      {courseTitle}
                    </h3>
                    <ul className="space-y-2">
                      {lessons.map((lesson: any) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        return (
                          <li key={lesson.id} className={`flex items-center justify-between p-3 bg-white dark:bg-gray-700/50 rounded-lg transition-all hover:shadow-sm ${isCompleted ? 'opacity-50' : ''}`}>
                            <Link
                              href={`/courses/${courseUrlPart}/lesson/${lesson.id}`}
                              className={`font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${isCompleted ? 'line-through' : ''}`}
                            >
                              {lesson.title}
                            </Link>
                            <span className={`text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 ${isCompleted ? 'line-through' : ''}`}>
                              <span className="w-2 h-2 rounded-full bg-secondary-400"></span>
                              {Math.round(lesson.duration / 60)} min
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {isGeneratingPlan ? "Seu plano está sendo criado pela IA..." :
                (hasAnyPlan ? "Nenhuma aula planejada para este dia." : "Gere seu plano de estudos para começar.")
              }
            </p>
          </div>
        )}
      </div>

      {/* --- AVISO DE GERAÇÃO (O POPUP) --- */}
      {isGeneratingPlan && (
        <ReorgNotification
          icon={Loader2}
          color="text-primary-500"
          message="Aguarde... Nossa IA está criando seu plano de estudos. Isso pode levar uns 5 minutinhos. Você será avisado quando estiver pronto."
          isSpinning
        />
      )}
      {/* --- FIM DO AVISO --- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. CALENDÁRIO (Esquerda) */}
        <div className="lg:col-span-2 glass-panel dark:glass-panel-dark p-6 rounded-2xl shadow-lg">
          <Calendar
            onChange={handleCalendarChange}
            value={selectedDate}
            className="react-calendar-custom w-full"
            tileClassName={({ date, view }) => {
              if (view === 'month' && hasAnyPlan) {
                const dateStr = formatDate(date);
                // Verifica se ALGUM plano tem aula neste dia
                const hasLesson = allPlans.some(p => p.plan.plan.some(d => d.date === dateStr));
                if (hasLesson) {
                  return 'has-lessons';
                }
              }
              return null;
            }}
            selectRange={false}
            locale="pt-BR"
          />
        </div>

        {/* 3. ESTATÍSTICAS (Direita) */}
        <div className="space-y-6">
          <div className="glass-panel dark:glass-panel-dark p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-secondary-500" />
              Minhas Metas
            </h3>
            <div className="space-y-4">
              {/* Mostra stats agregados ou do primeiro plano como exemplo */}
              <StatCard icon={Target} title="Planos Ativos" value={`${allPlans.length}`} color="text-blue-500" bg="bg-blue-100 dark:bg-blue-900/30" />
              <StatCard icon={Trophy} title="Ofensiva (Streak)" value={`${profile?.studyStreak || 0} Dias`} color="text-yellow-500" bg="bg-yellow-100 dark:bg-yellow-900/30" />
              <StatCard icon={BookOpen} title="Aulas de Hoje" value={`${lessonsTodayCount} Aulas`} color="text-purple-500" bg="bg-purple-100 dark:bg-purple-900/30" />
              <StatCard icon={CheckCircle} title="Próxima Conclusão" value={nextCompletionDate} color="text-green-500" bg="bg-green-100 dark:bg-green-900/30" />
            </div>

            {/* Lista de Planos Ativos */}
            {hasAnyPlan && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Seus Cursos</h4>
                <div className="space-y-3">
                  {allPlans.map((p, idx) => {
                    // Tenta achar o título do curso pelo ID do plano (que deve ser o courseId)
                    // Como coursePlans é um objeto, precisamos iterar as chaves para saber qual ID corresponde a este plano 'p'
                    // Mas aqui 'p' é o valor. Vamos achar a chave.
                    const courseId = Object.keys(profile?.coursePlans || {}).find(key => profile?.coursePlans[key] === p);
                    const course = courses.find(c => c.id === courseId);
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{course?.title || courseId || "Curso Desconhecido"}</span>
                        <span className="text-gray-500 text-xs">{formatDisplayDate(p.plan.expectedCompletionDate)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isGeneratingPlan}
            className="w-full px-6 py-4 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPlan ? "Gerando plano..." : "Criar Novo Plano de Estudos"}
          </button>
        </div>
      </div>

      {/* 5. O MODAL (Agora só abre se não estiver gerando) */}
      {!isGeneratingPlan && (
        <StudyPlannerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        // Sem courseId, ele vai pedir para selecionar o curso
        />
      )}
    </div>
  );
};

// Componentes StatCard e ReorgNotification
const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string; color?: string; bg?: string }> =
  ({ icon: Icon, title, value, color = "text-primary-600", bg = "bg-primary-100" }) => (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <div className={`p-3 ${bg} rounded-lg`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

const ReorgNotification: React.FC<{ icon: React.ElementType; color: string; message: string; isSpinning?: boolean; }> =
  ({ icon: Icon, color, message, isSpinning = false }) => (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700">
      <Icon className={`w-5 h-5 ${color} ${isSpinning ? 'animate-spin' : ''}`} />
      <p className="font-medium text-yellow-700 dark:text-yellow-300">{message}</p>
    </div>
  );

export default PlannerPage;