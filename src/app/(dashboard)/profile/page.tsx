"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useCourseContext } from '@/context/CourseProvider';
import { auth } from '@/config/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { AVATAR_LIST } from '@/data/avatars';
import { UserProfile } from '@/types';
import lessonDurations from '@/data/lessonDurations.json';
import { courseData } from '@/data/courseData'; 

const durations: Record<string, number> = lessonDurations;

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;
  return result.trim();
}

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
  const { completedLessons, resetProgress } = useCourseContext();

  // Estados dos formulários
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('prefiro-nao-dizer');
  const [avatarPath, setAvatarPath] = useState('');
  const [focusArea, setFocusArea] = useState(''); // <-- ADICIONADO
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [isProfileDirty, setIsProfileDirty] = useState(false); 
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBirthDate(profile.birthDate || '');
      setGender(profile.gender || 'prefiro-nao-dizer');
      setAvatarPath(profile.avatarPath);
      setFocusArea(profile.focusArea || ''); // <-- ADICIONADO
      setIsProfileDirty(false); 
    }
  }, [profile]);

  const { progressPercentage, totalTimeStudied } = useMemo(() => {
    // ... (lógica de estatísticas, sem mudança)
    const totalLessons = courseData.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const completedCount = completedLessons.size;
    const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
    let timeStudied = 0;
    for (const lessonId of completedLessons) {
      if (durations[lessonId]) {
        timeStudied += durations[lessonId];
      }
    }
    return {
      progressPercentage: Math.round(progress),
      totalTimeStudied: formatDuration(timeStudied),
    };
  }, [completedLessons]);

  const sortedAvatars = useMemo(() => {
    // ... (lógica dos avatares, sem mudança)
    const { masculino, feminino, outros } = AVATAR_LIST;
    if (gender === 'masculino') return [...masculino, ...outros, ...feminino];
    if (gender === 'feminino') return [...feminino, ...outros, ...masculino];
    return [...outros, ...masculino, ...feminino];
  }, [gender]);

  const handleProfileChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setIsProfileDirty(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProfileSaving(true);
    setMessage({ type: '', text: '' });

    const newProfileData: Partial<UserProfile> = {
      displayName,
      birthDate,
      gender,
      avatarPath,
      focusArea: focusArea || "Sem foco definido", // <-- ADICIONADO
    };
    
    await updateProfile(user.uid, newProfileData);
    
    setIsProfileSaving(false);
    setIsProfileDirty(false); 
    setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    // ... (função sem alteração)
    e.preventDefault();
    if (!user || !user.email) {
      setMessage({ type: 'error', text: 'Usuário não encontrado.' });
      return;
    }
    
    setIsPasswordSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao alterar a senha. Verifique sua senha atual.' });
    }
    
    setIsPasswordSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleResetProgress = () => {
    // ... (função sem alteração)
    if (window.confirm("Você tem certeza? Todo o seu progresso de aulas e anotações será apagado permanentemente.")) {
      resetProgress();
      setMessage({ type: 'success', text: 'Seu progresso foi resetado.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
      
      {/* --- ESTATÍSTICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... (código das estatísticas, sem mudança) ... */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Progresso do Curso</h2>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div 
              className="bg-primary-600 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-right mt-2 font-semibold text-primary-600 dark:text-primary-400">
            {progressPercentage}% Completo
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Total de Estudo</p>
          <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">
            {totalTimeStudied}
          </p>
        </div>
      </div>

      {/* --- ATUALIZAR PERFIL (Firestore) --- */}
      <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Informações Públicas</h2>
        
        {/* Seletor de Avatar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Escolha seu Avatar</label>
          <div className="flex flex-wrap gap-3">
            {sortedAvatars.map(path => (
              <button
                type="button"
                key={path}
                onClick={() => handleProfileChange(setAvatarPath, path)}
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
        </div>

        {/* Campos de Texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome (Apelido)</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => handleProfileChange(setDisplayName, e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) => handleProfileChange(setBirthDate, e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gênero (para avatares)</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => handleProfileChange(setGender, e.target.value as UserProfile['gender'])}
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="prefiro-nao-dizer">Prefiro não dizer</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* --- CAMPO DE FOCO ADICIONADO --- */}
          <div>
            <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foco de Carreira</label> 
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ex: "Vendas", "RH", "Produção"</p>
            <input
              type="text"
              id="focusArea"
              value={focusArea}
              onChange={(e) => handleProfileChange(setFocusArea, e.target.value)}
              placeholder="Qual sua área de foco?"
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!isProfileDirty || isProfileSaving}
          className={`px-6 py-2 text-white rounded-lg transition-colors ${
            isProfileDirty ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {isProfileSaving ? (
            <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando...</>
          ) : (
            'Salvar Perfil'
          )}
        </button>
      </form>

      {/* --- ATUALIZAR SENHA (Auth) --- */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        {/* ... (código do formulário de senha, sem mudança) ... */}
         <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Alterar Senha</h2>
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha Atual</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova Senha</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPasswordSaving || !currentPassword || !newPassword}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {isPasswordSaving ? 'Salvando...' : 'Alterar Senha'}
        </button>
      </form>

      {/* --- ZONA DE PERIGO (NOVO) --- */}
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-500 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Zona de Perigo</h2>
          <p className="text-sm text-red-600 dark:text-red-200">
            Cuidado, esta ação é irreversível. Isso apagará todo o seu progresso de aulas e anotações.
          </p>
          <button
            onClick={handleResetProgress}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <i className="fas fa-trash mr-2"></i>
            Resetar Progresso do Curso
          </button>
      </div>

      {/* Mensagem de Feedback (movemos para o final) */}
      {message.text && (
        <div 
          className={`fixed bottom-8 right-8 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-secondary-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;