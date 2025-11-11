"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { AVATAR_LIST } from '@/data/avatars';
import { UserProfile } from '@/types';

// --- INTERFACES PRIMEIRO ---

// Interface para as props da Etapa 1
interface Step1InfoProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  nextStep: () => void;
}

// Interface para as props da Etapa 2
interface Step2AvatarProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  isSaving: boolean; 
}

// --- COMPONENTES FILHO ---

// Componente da Etapa 1: Informações
const Step1Info: React.FC<Step1InfoProps> = ({ profile, setProfile, nextStep }) => {
  const [displayName, setDisplayName] = useState(profile.displayName === "Novo Aluno" ? "" : profile.displayName);
  const [birthDate, setBirthDate] = useState(profile.birthDate || "");
  const [gender, setGender] = useState(profile.gender || "prefiro-nao-dizer");
  // --- ADICIONADO ---
  const [focusArea, setFocusArea] = useState(profile.focusArea === "Sem foco definido" ? "" : (profile.focusArea || ""));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setDisplayName(""); 
      alert("Por favor, insira um nome.");
      return;
    }
    // --- ATUALIZADO ---
    setProfile({ ...profile, displayName, birthDate, gender, focusArea: focusArea || "Sem foco definido" });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Etapa 1: Nos diga sobre você</h2>
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome (como prefere ser chamado)</label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      
      {/* --- CAMPO DE FOCO ADICIONADO --- */}
      <div>
        <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foco de Carreira (Opcional)</label>
         <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ex: "Power BI para Vendas", "Análise de RH", "Controle de Produção"</p>
        <input
          type="text"
          id="focusArea"
          value={focusArea}
          onChange={(e) => setFocusArea(e.target.value)}
          placeholder="Em qual área você quer focar seus estudos?"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
        <input
          type="date"
          id="birthDate"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gênero (para priorizar avatares)</label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as UserProfile['gender'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="prefiro-nao-dizer">Prefiro não dizer</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!displayName.trim()} 
        className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
      >
        Próximo (Escolher Avatar)
      </button>
    </form>
  );
};

// Componente da Etapa 2: Avatar
// ... (Nenhuma alteração necessária no Step2Avatar) ...
const Step2Avatar: React.FC<Step2AvatarProps> = ({ profile, setProfile, saveProfile, isSaving }) => {
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath);

  const sortedAvatars = useMemo(() => {
    const { masculino, feminino, outros } = AVATAR_LIST;
    const gender = profile.gender;
    
    if (gender === 'masculino') {
      return [...masculino, ...outros, ...feminino];
    }
    if (gender === 'feminino') {
      return [...feminino, ...outros, ...masculino];
    }
    return [...outros, ...masculino, ...feminino];
  }, [profile.gender]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile = { ...profile, avatarPath };
    setProfile(finalProfile);
    saveProfile(finalProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Etapa 2: Escolha seu avatar</h2>
      <div className="flex flex-wrap gap-3 justify-center max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
        {sortedAvatars.map(path => (
          <button
            type="button"
            key={path}
            onClick={() => setAvatarPath(path)}
            className={`rounded-full transition-all duration-200 ${avatarPath === path ? 'ring-4 ring-primary-500' : 'hover:scale-110'}`}
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
      <button
        type="submit"
        disabled={isSaving} 
        className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
      >
        {isSaving ? (
          <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando...</>
        ) : (
          'Salvar Perfil e Começar'
        )}
      </button>
    </form>
  );
};


// --- COMPONENTE PRINCIPAL (PÁGINA) ---
// ... (Nenhuma alteração necessária no componente principal) ...
const WelcomePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, updateProfile, isLoadingProfile } = useProfileStore(); 
  
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false); 

  useEffect(() => {
    if (profile) {
      setProfileData(profile);
    }
  }, [profile]);

  const handleSaveProfile = async (finalProfile: UserProfile) => {
    if (!user) return;
    setIsSaving(true); 
    await updateProfile(user.uid, finalProfile);
    router.push('/'); 
  };

  if (isLoadingProfile || !profileData) { 
    return (
      <div className="flex h-screen items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-primary-600 dark:text-primary-400">
        Bem-vindo(a) ao LearnAI!
      </h1>
      {step === 1 && (
        <Step1Info 
          profile={profileData}
          setProfile={setProfileData}
          nextStep={() => setStep(2)} 
        />
      )}
      {step === 2 && (
        <Step2Avatar 
          profile={profileData}
          setProfile={setProfileData}
          saveProfile={handleSaveProfile}
          isSaving={isSaving} 
        />
      )}
    </div>
  );
};

export default WelcomePage;