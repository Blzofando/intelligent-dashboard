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

// --- TIPO DE VÍDEO ---
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  embedUrl: string;
}

// --- PERFIL DO USUÁRIO (ATUALIZADO) ---
export interface UserProfile {
  displayName: string;
  birthDate: string;
  focusArea?: string;
  gender: 'masculino' | 'feminino' | 'outros' | 'prefiro-nao-dizer';
  avatarPath: string;
  completedLessons: string[];
  lessonNotes: Record<string, string>;

  // Informações do Plano
  studySettings: StudySettings | null;
  studyPlan: StudyPlan | null;

  // --- LÓGICA DE OFENSIVA (STREAK) ATUALIZADA ---
  studyStreak: number;
  lastStreakUpdate: string | null; // "YYYY-MM-DD", para saber o último dia que o streak foi incrementado
  // --- FIM DA ATUALIZAÇÃO ---

  // Cache de Vídeos
  videoRecommendations?: YouTubeVideo[] | null;
  videoRecsLastUpdated?: string | null;
}

// --- Tipos do Curso ---
export interface CourseCategory {
  name: string;
  moduleIds: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  modules: Module[];
  categories?: CourseCategory[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}


export interface Lesson {
  id: string;
  title: string;
  materialUrl?: string;
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