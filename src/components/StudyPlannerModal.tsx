"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { StudySettings, StudyPlan } from '@/types';
import { Check, Loader2, Rocket, Brain, Feather, CalendarDays } from 'lucide-react';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 

// 1. CORREÇÃO DA IMPORTAÇÃO DE TIPOS
import type { CalendarProps } from 'react-calendar';
type Value = CalendarProps['value']; // O tipo correto é 'Value'

// Tipos dos dias (para o formulário)
type DayOfWeek = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDays: DayOfWeek[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// Função para formatar data como "YYYY-MM-DD"
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
  const [startDate, setStartDate] = useState<Value>(new Date()); // 2. CORREÇÃO: O estado aceita 'Value'

  // Etapa 3
  const [focusArea, setFocusArea] = useState('');

  const { user } = useAuthStore();
  const { profile, updateStudyPlan } = useProfileStore();

  if (!isOpen) return null;

  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = new Set(daysOfWeek);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setDaysOfWeek(newDays);
  };

  const handleModeSelect = (mode: 'suave' | 'regular' | 'intensivo', minutes: number) => {
    setMode(mode);
    setMinutesPerDay(minutes);
    setStep(2); 
  };

  // 3. CORREÇÃO: A função de handler agora aceita 'Value'
  const handleCalendarChange = (value: Value) => {
    setStartDate(value); // O estado agora pode aceitar Value (Date, Date[], null)
  };

  const handleGeneratePlan = async (useFocus: boolean) => {
    if (!user || !profile || !startDate) return;
    setIsLoading(true);

    // 4. CORREÇÃO: Garante que estamos pegando a data certa, mesmo se for um range
    const dateToSave = Array.isArray(startDate) ? startDate[0] : startDate;

    // --- 5. CORREÇÃO DO ERRO 2 ---
    // Precisamos garantir que dateToSave é um objeto Date, não null ou string
    let finalDate: Date;
    if (typeof dateToSave === 'string') {
      finalDate = new Date(dateToSave); // Converte string para Date
    } else if (dateToSave === null) {
      finalDate = new Date(); // Fallback para hoje se for nulo
    } else {
      finalDate = dateToSave; // Já é um Date
    }
    // --- FIM DA CORREÇÃO ---

    const settings: StudySettings = {
      mode,
      minutesPerDay,
      daysOfWeek: Array.from(daysOfWeek),
      focusArea: useFocus ? focusArea : "", 
      startDate: formatDate(finalDate), // Usa a data 100% segura
    };

    try {
      // Chama a API do Gemini
      const response = await fetch('/api/gemini/generate-plan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          completedLessons: profile.completedLessons, 
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar o plano (Gemini).");
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ModeCard icon={Feather} title="Suave" description="Aprox. 30 min / dia" onClick={() => handleModeSelect('suave', 30)} isSelected={mode === 'suave'} />
                <ModeCard icon={Brain} title="Regular" description="Aprox. 1h / dia" onClick={() => handleModeSelect('regular', 60)} isSelected={mode === 'regular'} />
                <ModeCard icon={Rocket} title="Intensivo" description="Aprox. 1h 30min / dia" onClick={() => handleModeSelect('intensivo', 90)} isSelected={mode === 'intensivo'} />
              </div>
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
              
              {/* Seleção de Data de Início */}
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

              <button 
                onClick={() => setStep(3)}
                disabled={daysOfWeek.size === 0}
                className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
              >
                Próximo (Foco)
              </button>
            </div>
          )}

          {/* ETAPA 3: FOCO */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">4. (Opcional) Deseja focar em alguma área?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ex: "Power BI focado na área de licitação"
              </p>
              <textarea
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="Descreva seu foco aqui..."
                className="w-full h-24 p-2 border rounded-md"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
                
                {focusArea.trim() === '' ? (
                  // Se NÃO houver texto
                  <button 
                    onClick={() => handleGeneratePlan(false)} 
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Pular e Gerar Plano'}
                  </button>
                ) : (
                  // Se HÁ texto
                  <>
                    <button 
                      onClick={() => handleGeneratePlan(false)}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
                    >
                      {isLoading ? 'Aguarde...' : 'Pular Foco'}
                    </button>
                    <button 
                      onClick={() => handleGeneratePlan(true)}
                      disabled={isLoading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Gerar Plano com Foco'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
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
    className={`p-6 border-2 rounded-lg text-left transition-all ${
      isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    <Icon className="w-8 h-8 text-primary-500 mb-2" />
    <h4 className="text-lg font-bold">{title}</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </button>
);

const DayButton: React.FC<{day: string, isSelected: boolean, onClick: () => void}> = 
  ({ day, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-full font-semibold transition-colors ${
      isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
    }`}
  >
    {day.toUpperCase()}
  </button>
);

