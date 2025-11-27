"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { X, Check, Calendar as CalendarIcon, Clock, BookOpen, Loader2, Trophy, Target } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { StudySettings, StudyPlan } from '@/types';
import { courses } from '@/data/courses';

interface StudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyPlannerModal: React.FC<StudyPlannerModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { updateStudyPlan, profile } = useProfileStore();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Mode & Time
  const [mode, setMode] = useState<StudySettings['mode']>('regular');
  const [minutesPerDay, setMinutesPerDay] = useState(60);

  // Step 2: Courses & Distribution
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<Record<string, number>>({});

  // Step 3: Schedule
  const [daysOfWeek, setDaysOfWeek] = useState<Set<string>>(new Set(['seg', 'ter', 'qua', 'qui', 'sex']));
  const [startDate, setStartDate] = useState<Date>(new Date());

  const allDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  // Handlers
  const handleCourseToggle = (courseId: string) => {
    let newSelected = [...selectedCourseIds];
    if (newSelected.includes(courseId)) {
      newSelected = newSelected.filter(id => id !== courseId);
    } else {
      newSelected.push(courseId);
    }
    setSelectedCourseIds(newSelected);

    // Recalcula distribuição igualitária
    if (newSelected.length > 0) {
      const share = Math.floor(100 / newSelected.length);
      const remainder = 100 % newSelected.length;
      const newDist: Record<string, number> = {};
      newSelected.forEach((id, index) => {
        newDist[id] = share + (index === 0 ? remainder : 0);
      });
      setCourseDistribution(newDist);
    } else {
      setCourseDistribution({});
    }
  };

  const handleDistributionChange = (courseId: string, newValue: number) => {
    if (selectedCourseIds.length === 2) {
      const otherId = selectedCourseIds.find(id => id !== courseId);
      if (otherId) {
        setCourseDistribution({
          [courseId]: newValue,
          [otherId]: 100 - newValue
        });
      }
    } else {
      // Simples atualização para > 2 cursos (pode não somar 100% perfeitamente na UI, mas o backend normaliza ou o user ajusta)
      // Idealmente implementaria uma lógica de "roubar" dos outros, mas para MVP isso serve.
      setCourseDistribution(prev => ({ ...prev, [courseId]: newValue }));
    }
  };

  const handleDayToggle = (day: string) => {
    const newDays = new Set(daysOfWeek);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setDaysOfWeek(newDays);
  };

  const handleCalendarChange = (value: any) => {
    const date = Array.isArray(value) ? value[0] : value;
    if (date) setStartDate(date);
  };

  const handleGeneratePlan = async () => {
    if (!user || !updateStudyPlan || !profile) return;
    setIsLoading(true);

    try {
      const finalDate = new Date(startDate);
      finalDate.setHours(12, 0, 0, 0);

      const settings: StudySettings = {
        mode,
        minutesPerDay,
        daysOfWeek: Array.from(daysOfWeek) as any,
        focusArea: profile.focusArea || "Geral",
        startDate: finalDate.toISOString().split('T')[0],
        selectedCourses: selectedCourseIds,
        courseDistribution: courseDistribution
      };

      const response = await fetch('/api/gemini/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          completedLessons: profile.completedLessons
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar plano");

      const data = await response.json();
      await updateStudyPlan(user.uid, settings, data);
      onClose();

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o plano. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Planejador de Estudos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10" />
            {[1, 2, 3].map((s) => (
              <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                }`}>
                {s}
              </div>
            ))}
          </div>

          {/* STEP 1: MODE */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold dark:text-white">1. Qual seu ritmo de estudo?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModeCard
                  title="Suave"
                  description="30 min/dia. Para quem tem pouco tempo."
                  icon={Clock}
                  isSelected={mode === 'suave'}
                  onClick={() => { setMode('suave'); setMinutesPerDay(30); }}
                />
                <ModeCard
                  title="Regular"
                  description="1h/dia. Ritmo constante e equilibrado."
                  icon={BookOpen}
                  isSelected={mode === 'regular'}
                  onClick={() => { setMode('regular'); setMinutesPerDay(60); }}
                />
                <ModeCard
                  title="Intensivo"
                  description="1h30/dia. Para quem quer avançar rápido."
                  icon={Trophy}
                  isSelected={mode === 'intensivo'}
                  onClick={() => { setMode('intensivo'); setMinutesPerDay(90); }}
                />
                <ModeCard
                  title="Personalizado"
                  description="Defina seu próprio tempo."
                  icon={Target}
                  isSelected={mode === 'personalizado'}
                  onClick={() => setMode('personalizado')}
                />
              </div>

              {mode === 'personalizado' && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <label className="block text-sm font-medium mb-2">Minutos por dia:</label>
                  <input
                    type="number"
                    value={minutesPerDay}
                    onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                    className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COURSES */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold dark:text-white">2. O que você vai estudar?</h3>

              {/* Seleção de Cursos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseToggle(course.id)}
                    className={`cursor-pointer p-4 border-2 rounded-lg flex items-center gap-4 transition-all ${selectedCourseIds.includes(course.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedCourseIds.includes(course.id) ? 'border-primary-500 bg-primary-500' : 'border-gray-400'
                      }`}>
                      {selectedCourseIds.includes(course.id) && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white">{course.title}</h4>
                      <p className="text-xs text-gray-500">{course.modules.length} módulos</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Distribuição (Gráfico de Barra) */}
              {selectedCourseIds.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 dark:text-gray-200">Distribuição do Tempo ({minutesPerDay} min/dia)</h4>

                  {/* Barra Visual */}
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden flex mb-4">
                    {selectedCourseIds.map((id, index) => {
                      const pct = courseDistribution[id] || 0;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                      const color = colors[index % colors.length];

                      return pct > 0 ? (
                        <div
                          key={id}
                          className={`${color} h-full flex items-center justify-center text-[10px] text-white font-bold transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        >
                          {pct > 10 && `${pct}%`}
                        </div>
                      ) : null;
                    })}
                  </div>

                  {/* Sliders de Ajuste */}
                  {selectedCourseIds.length > 1 ? (
                    <div className="space-y-4">
                      {selectedCourseIds.map((id, index) => {
                        const course = courses.find(c => c.id === id);
                        const pct = courseDistribution[id] || 0;
                        const time = Math.round((minutesPerDay * pct) / 100);

                        return (
                          <div key={id} className="flex items-center gap-4">
                            <span className="text-sm font-medium w-32 truncate dark:text-gray-300">{course?.title}</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={pct}
                              onChange={(e) => handleDistributionChange(id, Number(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-bold w-16 text-right dark:text-gray-300">{pct}%</span>
                            <span className="text-xs text-gray-500 w-16 text-right">({time} min)</span>
                          </div>
                        );
                      })}
                      <p className="text-xs text-gray-400 mt-2 text-center">Ajuste as porcentagens para definir quanto tempo dedicar a cada curso.</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">100% do tempo dedicado a este curso.</p>
                  )}
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedCourseIds.length === 0}
                  className="flex-1 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCHEDULE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">3. Quais dias você quer estudar?</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {allDays.map(day => (
                    <DayButton key={day} day={day} isSelected={daysOfWeek.has(day)} onClick={() => handleDayToggle(day)} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold dark:text-white">4. Quando você quer começar?</h3>
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

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  Voltar
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={daysOfWeek.size === 0 || isLoading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {isLoading ? 'Gerando Plano...' : 'Gerar Novo Plano'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ModeCard: React.FC<{ title: string, description: string, icon: any, isSelected: boolean, onClick: () => void }> =
  ({ title, description, icon: Icon, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`p-6 border-2 rounded-lg text-left transition-all h-full ${isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
    >
      <Icon className="w-8 h-8 text-primary-500 mb-2" />
      <h4 className="text-lg font-bold dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );

const DayButton: React.FC<{ day: string, isSelected: boolean, onClick: () => void }> =
  ({ day, isSelected, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 w-12 h-12 rounded-full font-semibold transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
        }`}
    >
      {day.toUpperCase()}
    </button>
  );