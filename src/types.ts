// src/types.ts

// --- TIPOS DO PLANO DE ESTUDOS ---
export interface StudySettings {
  mode: 'suave' | 'regular' | 'intensivo' | 'personalizado';
  minutesPerDay: number;
  daysOfWeek: ('seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom')[];
  focusArea: string;
  startDate: string; 
}

export interface StudyPlanDay {
  date: string; // Salva como string "YYYY-MM-DD"
  lessons: { id: string; title: string; duration: number }[];
}

export interface StudyPlan {
  plan: StudyPlanDay[];
  expectedCompletionDate: string; // "YYYY-MM-DD"
}

// --- PERFIL DO USUÁRIO (ATUALIZADO) ---
export interface UserProfile {
  displayName: string;
  birthDate: string; 
  gender: 'masculino' | 'feminino' | 'outros' | 'prefiro-nao-dizer';
  avatarPath: string;
  completedLessons: string[]; 
  lessonNotes: Record<string, string>;
  studySettings: StudySettings | null;
  studyPlan: StudyPlan | null;
  studyStreak: number; 
}

// --- Tipos do Curso (sem alteração) ---
export interface Course {
  title: string;
  modules: Module[];
}
export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}
export interface Lesson {
  id: string;
  title: string;
}

// --- Tipos do Gemini (sem alteração) ---
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
export interface Flashcard {
  front: string;
  back: string;
}