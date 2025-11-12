"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { StudySettings, StudyPlan } from '@/types';
// --- MUDANÇA: Importado o novo ícone ---
import { Check, Loader2, Rocket, Brain, Feather, CalendarDays, SlidersHorizontal } from 'lucide-react';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 

// Importação de tipos
import type { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value'];

// Tipos dos dias (para o formulário)
type DayOfWeek = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDays: DayOfWeek[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// Função para formatar data
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

interface StudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyPlannerModal: React.FC<StudyPlannerModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Etapa 1
  const [mode, setMode] = useState<'suave' | 'regular' | 'intensivo' | 'personalizado'>('regular');
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  
  // Etapa 2
  const [daysOfWeek, setDaysOfWeek] = useState<Set<DayOfWeek>>(new Set()); 
  const [startDate, setStartDate] = useState<Value>(new Date());

  // --- MUDANÇA: 'focusArea' foi removido deste state ---

  const { user } = useAuthStore();
  // --- MUDANÇA: Pegamos o 'profile' para ler o foco ---
  const { profile, updateStudyPlan } = useProfileStore();

  if (!isOpen) return null;

  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = new Set(daysOfWeek);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setDaysOfWeek(newDays);
  };

  // --- MUDANÇA: Lógica do modo personalizado ---
  const handleModeSelect = (
    newMode: 'suave' | 'regular' | 'intensivo' | 'personalizado', 
    minutes?: number
  ) => {
    setMode(newMode);
    if (minutes) {
      // Se for um modo fixo (Suave, Regular, Intensivo), define os minutos
      setMinutesPerDay(minutes);
    } else if (newMode === 'personalizado') {
      // Se for personalizado, mantém o valor atual (ou define um padrão se não for 120)
      if (mode !== 'personalizado') {
        setMinutesPerDay(120); // Padrão de 2h
      }
    }
  };
  // --- FIM DA MUDANÇA ---

  const handleCalendarChange = (value: Value) => {
    const dateToSave = Array.isArray(value) ? value[0] : value;
    if (dateToSave) {
        setStartDate(dateToSave);
    }
  };

  // --- MUDANÇA: A função de gerar plano agora é chamada na Etapa 2 ---
  const handleGeneratePlan = async () => {
    if (!user || !profile || !startDate) return;
    setIsLoading(true);

    const dateToSave = Array.isArray(startDate) ? startDate[0] : startDate;

    let finalDate: Date;
    if (typeof dateToSave === 'string') {
      finalDate = new Date(dateToSave);
    } else if (dateToSave === null) {
      finalDate = new Date();
    } else {
      finalDate = dateToSave;
    }

    const settings: StudySettings = {
      mode,
      minutesPerDay,
      daysOfWeek: Array.from(daysOfWeek),
      // Pega o foco do PERFIL, não mais do modal
      focusArea: profile.focusArea || "Sem foco definido", 
      startDate: formatDate(finalDate),
    };

    try {
      // Chama a API rápida (calculadora)
      const response = await fetch('/api/gemini/generate-plan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          completedLessons: profile.completedLessons, 
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o plano.");
      }

      const plan: StudyPlan = await response.json();
      await updateStudyPlan(user.uid, settings, plan);
      
      setIsLoading(false);
      onClose(); 
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Planejar Estudos</h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-3xl">&times;</button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* ETAPA 1: MODO */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">1. Qual é o seu ritmo de estudo?</h3>
              {/* --- MUDANÇA: Grid com 4 colunas --- */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ModeCard icon={Feather} title="Suave" description="Aprox. 30 min / dia" onClick={() => handleModeSelect('suave', 30)} isSelected={mode === 'suave'} />
                <ModeCard icon={Brain} title="Regular" description="Aprox. 1h / dia" onClick={() => handleModeSelect('regular', 60)} isSelected={mode === 'regular'} />
                <ModeCard icon={Rocket} title="Intensivo" description="Aprox. 1h 30min / dia" onClick={() => handleModeSelect('intensivo', 90)} isSelected={mode === 'intensivo'} />
                <ModeCard icon={SlidersHorizontal} title="Personalizado" description="Você escolhe" onClick={() => handleModeSelect('personalizado')} isSelected={mode === 'personalizado'} />
              </div>
              
              {/* --- MUDANÇA: Input slider para modo personalizado --- */}
              {mode === 'personalizado' && (
                <div className="pt-4 space-y-2">
                   <label htmlFor="custom-minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Tempo de estudo diário: <span className="font-bold text-primary-500">{minutesPerDay} minutos</span>
                   </label>
                   <input
                    id="custom-minutes"
                    type="range"
                    min="30"    // 30 min
                    max="240"   // 4 horas
                    step="15"
                    value={minutesPerDay}
                    onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb:bg-primary-600"
                   />
                </div>
              )}
              {/* --- FIM DA MUDANÇA --- */}

              <button 
                onClick={() => setStep(2)}
                className="w-full px-6 py-2 mt-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Próximo
              </button>
            </div>
          )}

          {/* ETAPA 2: DIAS E DATA DE INÍCIO */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-semibold">2. Quais dias você quer estudar?</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {allDays.map(day => (
                    <DayButton key={day} day={day} isSelected={daysOfWeek.has(day)} onClick={() => handleDayToggle(day)} />
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">3. Quando você quer começar?</h3>
                <div className="flex justify-center p-2 rounded-lg">
                  <Calendar
                    onChange={handleCalendarChange} 
                    value={startDate}
                    className="react-calendar-custom" 
                    minDate={new Date()} 
                    selectRange={false}
                    locale="pt-BR"
                  />
                </div>
              </div>

              {/* --- MUDANÇA: Botão "Próximo" agora é "Gerar Plano" --- */}
              <button 
                onClick={handleGeneratePlan}
                disabled={daysOfWeek.size === 0 || isLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {isLoading ? 'Gerando Plano...' : 'Gerar Novo Plano'}
              </button>
              {/* --- FIM DA MUDANÇA --- */}
            </div>
          )}

          {/* --- MUDANÇA: ETAPA 3 FOI REMOVIDA --- */}
          
        </div>
      </div>
    </div>
  );
};

// --- Componentes Internos do Modal (sem alteração) ---
const ModeCard: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void, isSelected?: boolean}> = 
  ({ icon: Icon, title, description, onClick, isSelected = false }) => (
  <button 
    onClick={onClick} 
    className={`p-6 border-2 rounded-lg text-left transition-all h-full ${
      isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    <Icon className="w-8 h-8 text-primary-500 mb-2" />
    <h4 className="text-lg font-bold dark:text-white">{title}</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </button>
);

const DayButton: React.FC<{day: string, isSelected: boolean, onClick: () => void}> = 
  ({ day, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 w-12 h-12 rounded-full font-semibold transition-colors ${
      isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
    }`}
  >
    {day.toUpperCase()}
  </button>
);