// --- TIPOS DO PLANO DE ESTUDOS (sem alteração) ---
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

// --- NOVO TIPO: Recomendação de Vídeo ---
// Representa um vídeo retornado pela busca no YouTube.
export interface YouTubeVideo {
  id: string; // ID do YouTube (ex: 'dQw4w9WgXcQ')
  title: string;
  description: string;
  thumbnail: string; // URL da Thumbnail
  embedUrl: string; // Link para o iframe (para o modal de visualização)
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