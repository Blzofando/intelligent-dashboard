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

// Tipagem do react-calendar
import type { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value']; // Date | Date[] | null

// Formatação de data
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
function formatDisplayDate(dateString: string): string {
  if (!dateString) return "N/D";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

type ReorgStatus = 'idle' | 'checking' | 'reorganizing' | 'failed';

const PlannerPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reorgStatus, setReorgStatus] = useState<ReorgStatus>('idle');

  const { user } = useAuthStore();
  const { profile, isLoadingProfile, updateStudyPlan } = useProfileStore();
  const plan = profile?.studyPlan;
  const settings = profile?.studySettings;

  // Reorganize handler em useCallback
  const handleReorganizePlan = useCallback(async (profileArg: UserProfile, settingsArg: StudySettings) => {
    if (!user || !updateStudyPlan) return;
    setReorgStatus('reorganizing');
    try {
      const response = await fetch('/api/gemini/reorganize-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileArg }),
      });

      if (!response.ok) throw new Error("Falha ao reorganizar o plano.");

      const newPlan: StudyPlan = await response.json();
      await updateStudyPlan(user.uid, settingsArg, newPlan);
      setReorgStatus('idle');
    } catch (error) {
      console.error(error);
      setReorgStatus('failed');
    }
  }, [user, updateStudyPlan]);

  useEffect(() => {
    if (isLoadingProfile) return;

    if (!plan && !isModalOpen) {
      setIsModalOpen(true);
    }

    if (user && profile && plan && settings && reorgStatus === 'idle') {
      const today = formatDate(new Date());
      const missedLessons = plan.plan.some(day =>
        day.date < today &&
        day.lessons.some(lesson => !profile.completedLessons.includes(lesson.id))
      );

      if (missedLessons) {
        setReorgStatus('checking');
        // chama reorganização imediatamente (sem setTimeout obrigatório)
        handleReorganizePlan(profile, settings);
      }
    }
  }, [profile, isLoadingProfile, plan, settings, isModalOpen, user, reorgStatus, handleReorganizePlan]);

  // handler do calendário: normaliza Value -> Date e garante tipo Date no state
  const handleCalendarChange = (value: Value) => {
    const maybe = Array.isArray(value) ? value[0] : value;
    if (!maybe) return;
    const newDate = (typeof maybe === 'string') ? new Date(maybe) : maybe;
    setSelectedDate(newDate);
  };

  const lessonsForSelectedDay: StudyPlanDay | undefined = useMemo(() => {
    if (!plan) return undefined;
    const dateString = formatDate(selectedDate);
    return plan.plan.find(day => day.date === dateString);
  }, [plan, selectedDate]);

  const lessonsTodayCount = useMemo(() => {
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
            {lessonsForSelectedDay.lessons.map(lesson => (
              <li key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Link href={`/lesson/${lesson.id}`} className="font-medium hover:text-primary-600 dark:hover:text-primary-400">
                  {lesson.title}
                </Link>
                <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(lesson.duration / 60)} min</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {plan ? "Nenhuma aula planejada para este dia." : "Você ainda não gerou um plano de estudos."}
          </p>
        )}
      </div>

      {/* --- AVISO DE REORGANIZAÇÃO --- */}
      {reorgStatus === 'checking' && (
        <ReorgNotification
          icon={AlertTriangle}
          color="text-yellow-500"
          message="Detectamos aulas atrasadas. Vamos reorganizar seu calendário..."
        />
      )}
      {reorgStatus === 'reorganizing' && (
        <ReorgNotification
          icon={Loader2}
          color="text-blue-500"
          message="Aguarde... Nossa IA (Gemini) está recalculando seu plano."
          isSpinning
        />
      )}
      {reorgStatus === 'failed' && (
        <ReorgNotification
          icon={AlertTriangle}
          color="text-red-500"
          message="Falha ao reorganizar. Tente gerar um novo plano manualmente."
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
            className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-all"
          >
            {plan ? "Gerar Novo Plano de Estudos" : "Planejar Meus Estudos"}
          </button>
        </div>
      </div>

      {/* 5. O MODAL */}
      <StudyPlannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// StatCard
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

// ReorgNotification
const ReorgNotification: React.FC<{ icon: React.ElementType; color: string; message: string; isSpinning?: boolean; }> =
  ({ icon: Icon, color, message, isSpinning = false }) => (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700">
      <Icon className={`w-5 h-5 ${color} ${isSpinning ? 'animate-spin' : ''}`} />
      <p className="font-medium text-yellow-700 dark:text-yellow-300">{message}</p>
    </div>
  );

export default PlannerPage;
