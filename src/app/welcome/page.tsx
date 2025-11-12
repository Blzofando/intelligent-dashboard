"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { AVATAR_LIST } from '@/data/avatars';
import { UserProfile, StudySettings, StudyPlan, YouTubeVideo } from '@/types';
import { Loader2, Rocket, Brain, Feather, CalendarDays, User, Smile, Check } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import { courseData } from '@/data/courseData'; 

// --- Tipos e Funções Auxiliares ---
type DayOfWeek = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDays: DayOfWeek[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
type CalendarValue = React.ComponentProps<typeof Calendar>['value'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// --- COMPONENTE PRINCIPAL (PÁGINA) ---
const WelcomePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    profile, 
    updateProfile, 
    isLoadingProfile, 
    setGeneratingPlan, 
    updateStudyPlan,   
    updateVideoRecs,
    setShowPlanReadyToast // Pega a nova função do toast
  } = useProfileStore(); 
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false); 

  const [formData, setFormData] = useState({
    displayName: "",
    birthDate: "",
    gender: "prefiro-nao-dizer" as UserProfile['gender'],
    focusArea: "",
    studyMode: "regular" as StudySettings['mode'],
    minutesPerDay: 60,
    daysOfWeek: new Set<DayOfWeek>(['seg', 'ter', 'qua', 'qui', 'sex']),
    startDate: new Date(),
    avatarPath: "/avatars/outros/o-01.png"
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        displayName: profile.displayName === "Novo Aluno" ? "" : profile.displayName,
        birthDate: profile.birthDate || "",
        gender: profile.gender || "prefiro-nao-dizer",
        focusArea: profile.focusArea === "Sem foco definido" ? "" : (profile.focusArea || ""),
        avatarPath: profile.avatarPath || "/avatars/outros/o-01.png",
      }));
    }
  }, [profile]);

  const handleFinalSubmit = async () => {
    if (!user || !profile) return;
    
    setIsSaving(true);
    setGeneratingPlan(true); 

    const finalProfileData: Partial<UserProfile> = {
      displayName: formData.displayName.trim() || "Novo Aluno",
      birthDate: formData.birthDate,
      gender: formData.gender,
      focusArea: formData.focusArea.trim() || "Sem foco definido",
      avatarPath: formData.avatarPath,
    };
    
    const finalSettings: StudySettings = {
      mode: formData.studyMode,
      minutesPerDay: formData.minutesPerDay,
      daysOfWeek: Array.from(formData.daysOfWeek),
      focusArea: finalProfileData.focusArea!,
      startDate: formatDate(formData.startDate),
    };
    
    await updateProfile(user.uid, { ...finalProfileData, studySettings: finalSettings });

    router.push('/');

    // Roda as APIs em "fire-and-forget"
    generateBackgroundTasks(user.uid, finalSettings, profile.completedLessons);
  };

  const generateBackgroundTasks = async (
    uid: string, 
    settings: StudySettings, 
    completedLessons: string[]
  ) => {
    try {
      // 5a. Gerar o Plano de Estudo
      const planResponse = await fetch('/api/gemini/generate-plan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, completedLessons }),
      });
      
      if (!planResponse.ok) throw new Error("Falha ao gerar o plano.");
      
      const newPlan: StudyPlan = await planResponse.json();
      await updateStudyPlan(uid, settings, newPlan); 

      // 5b. Gerar as Recomendações de Vídeo
      const firstModule = courseData.modules[0];
      const firstLesson = firstModule.lessons[0]; 

      const recsResponse = await fetch('/api/gemini/youtube-recs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusArea: settings.focusArea,
          nextTopic: firstLesson.title,
          moduleTitle: firstModule.title
        }),
      });

      if (recsResponse.ok) {
        const videos: YouTubeVideo[] = await recsResponse.json();
        await updateVideoRecs(uid, videos); 
      }

    } catch (error) {
      console.error("Erro ao gerar tarefas em segundo plano:", error);
    } finally {
      // 6. Avisa ao app que a geração terminou (e dispara o toast)
      setGeneratingPlan(false);
      setShowPlanReadyToast(true); // <-- Dispara o toast!
    }
  };

  if (isLoadingProfile || !profile) { 
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-center mb-4 text-primary-600 dark:text-primary-400">
        Bem-vindo(a) ao LearnAI!
      </h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
        Vamos configurar seu perfil para uma experiência de estudo perfeita.
      </p>

      <WelcomeStepper currentStep={currentStep} />

      <div className="overflow-hidden mt-8">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            width: '300%', 
            transform: `translateX(-${(currentStep - 1) * (100 / 3)}%)` 
          }}
        >
          {/* Etapa 1: Informações */}
          <div className="w-1/3 px-2">
            <Step1_UserInfo 
              formData={formData} 
              setFormData={setFormData} 
              onNext={() => setCurrentStep(2)} 
            />
          </div>

          {/* Etapa 2: Tipo de Estudo */}
          <div className="w-1/3 px-2">
            <Step2_StudyType 
              formData={formData} 
              setFormData={setFormData} 
              onBack={() => setCurrentStep(1)} 
              onNext={() => setCurrentStep(3)} 
            />
          </div>

          {/* Etapa 3: Avatar */}
          <div className="w-1/3 px-2">
            <Step3_Avatar 
              formData={formData} 
              setFormData={setFormData}
              onBack={() => setCurrentStep(2)} 
              onSubmit={handleFinalSubmit} 
              isSaving={isSaving} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES FILHOS (AS 3 ETAPAS) ---

// Stepper
const WelcomeStepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex justify-between items-center w-3/4 mx-auto mb-6">
    <StepCircle icon={User} step={1} currentStep={currentStep} title="Perfil" />
    <div className={`flex-1 h-1 ${currentStep > 1 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
    <StepCircle icon={CalendarDays} step={2} currentStep={currentStep} title="Plano" />
    <div className={`flex-1 h-1 ${currentStep > 2 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
    <StepCircle icon={Smile} step={3} currentStep={currentStep} title="Avatar" />
  </div>
);
const StepCircle: React.FC<{ icon: React.ElementType, step: number, currentStep: number, title: string }> = 
  ({ icon: Icon, step, currentStep, title }) => (
  <div className="flex flex-col items-center">
    <div 
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
        ${step === currentStep ? 'bg-primary-600 text-white scale-110' : ''}
        ${step < currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}
      `}
    >
      {step < currentStep ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
    </div>
    <span className={`mt-2 text-xs font-medium ${step === currentStep ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`}>
      {title}
    </span>
  </div>
);

// Etapa 1: Informações (Estilo atualizado)
const Step1_UserInfo: React.FC<{
  formData: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
}> = ({ formData, setFormData, onNext }) => {
  
  const [isNameValid, setIsNameValid] = useState(true);
  
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setIsNameValid(false);
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-5">
      <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">Suas Informações</h2>
      
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Nome (ou apelido)</label>
        <input
          type="text"
          id="displayName"
          value={formData.displayName}
          onChange={(e) => {
            setFormData({ ...formData, displayName: e.target.value });
            setIsNameValid(true);
          }}
          required
          placeholder="Como devemos te chamar?"
          className={`h-12 px-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${!isNameValid ? 'border-red-500' : ''}`}
        />
        {!isNameValid && <p className="text-xs text-red-500 mt-1">O nome é obrigatório.</p>}
      </div>

      <div>
        <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foco de Carreira (Opcional)</label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ex: "Vendas", "Análise de RH", "Licitações"</p>
        <input
          type="text"
          id="focusArea"
          value={formData.focusArea}
          onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
          placeholder="Em qual área você quer focar?"
          className="h-12 px-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nasc.</label>
          <input
            type="date"
            id="birthDate"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="h-12 px-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gênero</label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserProfile['gender'] })}
            className="h-12 px-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="prefiro-nao-dizer">Prefiro não dizer</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-semibold"
      >
        Próximo
      </button>
    </form>
  );
};

// Etapa 2: Configuração do Plano (Botão "Hoje" corrigido)
const Step2_StudyType: React.FC<{
  formData: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onBack: () => void;
  onNext: () => void;
}> = ({ formData, setFormData, onBack, onNext }) => {
  
  const [showCalendar, setShowCalendar] = useState(false);

  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = new Set(formData.daysOfWeek);
    if (newDays.has(day)) newDays.delete(day);
    else newDays.add(day);
    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const handleModeSelect = (mode: StudySettings['mode'], minutes: number) => {
    setFormData({ ...formData, studyMode: mode, minutesPerDay: minutes });
  };

  const handleCalendarChange = (value: CalendarValue) => {
    const date = Array.isArray(value) ? value[0] : value;
    if (date) {
      setFormData({ ...formData, startDate: date });
      setShowCalendar(false); // Fecha o calendário ao selecionar
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.daysOfWeek.size === 0) {
      alert("Selecione pelo menos um dia para estudar.");
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">Seu Plano de Estudo</h2>
      
      {/* Ritmo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Qual é o seu ritmo?</label>
        <div className="grid grid-cols-3 gap-2">
          <ModeCard icon={Feather} title="Suave" description="~30 min/dia" onClick={() => handleModeSelect('suave', 30)} isSelected={formData.studyMode === 'suave'} />
          <ModeCard icon={Brain} title="Regular" description="~1h/dia" onClick={() => handleModeSelect('regular', 60)} isSelected={formData.studyMode === 'regular'} />
          <ModeCard icon={Rocket} title="Intensivo" description="~1h 30min/dia" onClick={() => handleModeSelect('intensivo', 90)} isSelected={formData.studyMode === 'intensivo'} />
        </div>
      </div>

      {/* Dias da Semana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quais dias irá estudar?</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {allDays.map(day => (
            <DayButton key={day} day={day} isSelected={formData.daysOfWeek.has(day)} onClick={() => handleDayToggle(day)} />
          ))}
        </div>
      </div>
      
      {/* Data de Início (com o ícone que você pediu) */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quando quer começar?</label>
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="h-12 px-4 w-full flex items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-left"
        >
          <span className="text-gray-800 dark:text-gray-100">
            {isToday(formData.startDate) 
              ? "Hoje" 
              : formData.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          <CalendarDays className="w-5 h-5 text-gray-500" />
        </button>
        
        {showCalendar && (
          <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2"> 
            <Calendar
              onChange={handleCalendarChange} 
              value={formData.startDate}
              className="react-calendar-custom" 
              minDate={new Date()} 
              selectRange={false}
              locale="pt-BR"
            />
          </div>
        )}
      </div>
      
      {/* Botões de Navegação */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="w-1/2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={formData.daysOfWeek.size === 0}
          className="w-1/2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 font-semibold"
        >
          Próximo
        </button>
      </div>
    </form>
  );
};

// Etapa 3: Avatar (Sem alteração)
const Step3_Avatar: React.FC<{
  formData: any; 
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onBack: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}> = ({ formData, setFormData, onBack, onSubmit, isSaving }) => {
  
  const sortedAvatars = useMemo(() => {
    const { masculino, feminino, outros } = AVATAR_LIST;
    const gender = formData.gender;
    if (gender === 'masculino') return [...masculino, ...outros, ...feminino];
    if (gender === 'feminino') return [...feminino, ...outros, ...masculino];
    return [...outros, ...masculino, ...feminino];
  }, [formData.gender]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300">Escolha seu Avatar</h2>
      
      <div className="flex flex-wrap gap-3 justify-center max-h-[300px] overflow-y-auto p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
        {sortedAvatars.map(path => (
          <button
            type="button"
            key={path}
            onClick={() => setFormData({ ...formData, avatarPath: path })}
            className={`rounded-full transition-all duration-200 ${formData.avatarPath === path ? 'ring-4 ring-primary-500 scale-105' : 'hover:scale-110'}`}
          >
            <Image
              src={path}
              alt="Avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          </button>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="w-1/2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving} 
          className="w-1/2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          {isSaving ? 'Salvando...' : 'Salvar e Começar'}
        </button>
      </div>
    </div>
  );
};


// --- COMPONENTES DE UI PEQUENOS (Usados na Etapa 2) ---
const ModeCard: React.FC<{icon: React.ElementType, title: string, description: string, onClick: () => void, isSelected?: boolean}> = 
  ({ icon: Icon, title, description, onClick, isSelected = false }) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`p-4 border-2 rounded-lg text-left transition-all h-full ${
      isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`}
  >
    <Icon className="w-6 h-6 text-primary-500 mb-1" />
    <h4 className="text-base font-bold dark:text-white">{title}</h4>
    <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
  </button>
);

const DayButton: React.FC<{day: string, isSelected: boolean, onClick: () => void}> = 
  ({ day, isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 w-10 h-10 rounded-full font-semibold transition-colors text-sm ${
      isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:text-white'
    }`}
  >
    {day.toUpperCase()}
  </button>
);

export default WelcomePage;