// src/context/CourseProvider.tsx
"use client";

import React, { createContext, useContext } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { courseData } from '@/data/courseData'; // Importa o curso estático
import { Course, UserProfile } from '@/types'; // Importa UserProfile

// O "molde" do nosso contexto
interface CourseContextType {
  course: Course;
  completedLessons: Set<string>;
  notes: Record<string, string>;
  isLoadingProgress: boolean;
  toggleLessonCompleted: (lessonId: string) => void;
  updateNote: (itemId: string, text: string) => void;
  resetProgress: () => void;
}

const CourseContext = createContext<CourseContextType | null>(null);

export const CourseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const { 
    profile, 
    isLoadingProfile, // Corrigido: o nome certo é isLoadingProfile
    toggleLessonCompleted: storeToggle,
    updateNote: storeUpdate,
    resetProgress: storeReset
  } = useProfileStore();

  // Corrigido: Acessa os campos de progresso *de dentro* do objeto 'profile'
  const completedLessons = new Set(profile?.completedLessons || []);
  const notes = profile?.lessonNotes || {};

  // Funções "wrapper" que já incluem o UID do usuário
  const toggleLessonCompleted = (lessonId: string) => {
    if (user) storeToggle(user.uid, lessonId);
  };
  
  const updateNote = (itemId: string, text: string) => {
    if (user) storeUpdate(user.uid, itemId, text);
  };

  const resetProgress = () => {
    if (user) storeReset(user.uid);
  };

  // Monta o valor do contexto
  const value = {
    course: courseData,
    completedLessons,
    notes,
    isLoadingProgress: isLoadingProfile, // O "loading" do progresso é o loading do perfil
    toggleLessonCompleted,
    updateNote,
    resetProgress
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

// Este hook não muda
export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext deve ser usado dentro de um CourseProvider');
  }
  return context;
};