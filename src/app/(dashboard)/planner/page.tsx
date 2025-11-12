"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { StudyPlannerModal } from '@/components/StudyPlannerModal';
import { StudyPlanDay, StudyPlan, StudySettings, UserProfile } from '@/types';
import { BookOpen, CheckCircle, Target, Trophy, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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
  
  // --- 1. CORREÇÃO: Acessar 'completedLessons' de dentro do 'profile' ---
  const completedLessons = useMemo(() => new Set(profile?.completedLessons || []), [profile]);
  // --- FIM DA CORREÇÃO ---
  
  const plan = profile?.studyPlan;
  const settings = profile?.studySettings;

  // Handler de Reorganização
  const handleReorganizePlan = useCallback(async (profileArg: UserProfile, settingsArg: StudySettings) => {
    // ... (sem alteração) ...
    if (!user || !updateStudyPlan) return;
    setGeneratingPlan(true); 
    try {
      const response = await fetch('/api/gemini/reorganize-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileArg }),
      });
      if (!response.ok) throw new Error("Falha ao reorganizar o plano.");
      const newPlan: StudyPlan = await response.json();
      await updateStudyPlan(user.uid, settingsArg, newPlan);
    } catch (error) {
      console.error(error);
    }
    setGeneratingPlan(false); 
  }, [user, updateStudyPlan, setGeneratingPlan]);

  // useEffect principal (mostra modal ou popup)
  useEffect(() => {
    // ... (sem alteração) ...
    if (isLoadingProfile) return;
    if (!plan && !isModalOpen && !isGeneratingPlan) {
      setIsModalOpen(true);
    }
  }, [profile, isLoadingProfile, plan, isModalOpen, isGeneratingPlan]);

  // handler do calendário
  const handleCalendarChange = (value: Value) => {
    // ... (sem alteração) ...
    const maybe = Array.isArray(value) ? value[0] : value;
    if (!maybe) return;
    const newDate = (typeof maybe === 'string') ? new Date(maybe) : maybe;
    setSelectedDate(newDate);
  };

  // lessonsForSelectedDay
  const lessonsForSelectedDay: StudyPlanDay | undefined = useMemo(() => {
    // ... (sem alteração) ...
    if (!plan) return undefined;
    const dateString = formatDate(selectedDate);
    return plan.plan.find(day => day.date === dateString);
  }, [plan, selectedDate]);

  // lessonsTodayCount
  const lessonsTodayCount = useMemo(() => {
    // ... (sem alteração) ...
    if (!plan) return 0;
    const dateString = formatDate(new Date());
    return plan.plan.find(day => day.date === dateString)?.lessons.length || 0;
  }, [plan]);

  return (
    <div className="space-y-8">
      {/* 1. AULAS DO DIA (Topo) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Aulas de {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h1>
        {lessonsForSelectedDay ? (
          <ul className="mt-4 space-y-2">
            
            {/* --- 2. CORREÇÃO: Usar o 'completedLessons' (Set) --- */}
            {lessonsForSelectedDay.lessons.map(lesson => {
              const isCompleted = completedLessons.has(lesson.id); // Verifica no Set
              
              return (
                <li key={lesson.id} className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${isCompleted ? 'opacity-50' : ''}`}>
                  <Link 
                    href={`/lesson/${lesson.id}`} 
                    className={`font-medium hover:text-primary-600 dark:hover:text-primary-400 ${isCompleted ? 'line-through' : ''}`}
                  >
                    {lesson.title}
                  </Link>
                  <span className={`text-sm text-gray-500 dark:text-gray-400 ${isCompleted ? 'line-through' : ''}`}>
                    {Math.round(lesson.duration / 60)} min
                  </span>
                </li>
              );
            })}
            {/* --- FIM DA CORREÇÃO --- */}

          </ul>
        ) : (
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {isGeneratingPlan ? "Seu plano está sendo criado pela IA..." : 
             (plan ? "Nenhuma aula planejada para este dia." : "Gere seu plano de estudos para começar.")
            }
          </p>
        )}
      </div>

      {/* --- AVISO DE GERAÇÃO (O POPUP) --- */}
      {isGeneratingPlan && (
        <ReorgNotification
          icon={Loader2}
          color="text-blue-500"
          message="Aguarde... Nossa IA está criando seu plano de estudos. Isso pode levar uns 5 minutinhos. Você será avisado quando estiver pronto."
          isSpinning
        />
      )}
      {/* --- FIM DO AVISO --- */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. CALENDÁRIO (Esquerda) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <Calendar
            onChange={handleCalendarChange}
            value={selectedDate}
            className="react-calendar-custom"
            tileClassName={({ date, view }) => {
              if (view === 'month' && plan) {
                if (plan.plan.find(d => d.date === formatDate(date))) {
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Minhas Metas</h3>
            <div className="space-y-3">
              <StatCard icon={Target} title="Ritmo de Estudo" value={settings ? settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1) : "N/D"} />
              <StatCard icon={Trophy} title="Ofensiva (Streak)" value={`${profile?.studyStreak || 0} Dias`} />
              <StatCard icon={BookOpen} title="Aulas de Hoje" value={`${lessonsTodayCount} Aulas`} />
              <StatCard icon={CheckCircle} title="Expectativa de Conclusão" value={plan ? formatDisplayDate(plan.expectedCompletionDate) : "N/D"} />
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isGeneratingPlan} 
            className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-all disabled:bg-gray-500"
          >
            {isGeneratingPlan ? "Gerando plano..." : (plan ? "Gerar Novo Plano de Estudos" : "Planejar Meus Estudos")}
          </button>
        </div>
      </div>

      {/* 5. O MODAL (Agora só abre se não estiver gerando) */}
      {!isGeneratingPlan && (
        <StudyPlannerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// Componentes StatCard e ReorgNotification
const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string; }> =
  ({ icon: Icon, title, value }) => (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-lg font-bold">{value}</p>
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