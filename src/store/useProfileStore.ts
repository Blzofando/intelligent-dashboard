import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import {
  UserProfile,
  StudyPlan,
  StudySettings,
  YouTubeVideo,
  StudyPlanDay,
  CoursePlan,
  CourseYouTubeRecs,
} from "@/types";

// --- Helper: Formatar Data ---
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Valores padrão
const defaultProfile: UserProfile = {
  displayName: "Novo Aluno",
  avatarPath: "/avatars/outros/o-01.png",
  gender: "prefiro-nao-dizer",
  birthDate: "",
  focusArea: "Sem foco definido",
  completedLessons: [],
  lessonNotes: {},
  coursePlans: {}, // <-- ATUALIZADO: Inicializa vazio
  youtubeRecs: {}, // Inicializa as recomendações vazias
  studyStreak: 0,
  lastStreakUpdate: null,
  lastDailyCheck: null,
  dailyCheckHistory: [],
};

interface ProfileState {
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  isGeneratingPlan: boolean;
  showPlanReadyToast: boolean;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (
    uid: string,
    newProfileData: Partial<UserProfile>,
  ) => Promise<void>;

  // Ações de progresso
  toggleLessonCompleted: (
    uid: string,
    lessonId: string,
    courseId?: string,
  ) => Promise<void>; // <-- courseId opcional para streak
  updateNote: (uid: string, itemId: string, text: string) => Promise<void>;
  resetProgress: (uid: string) => Promise<void>;

  // Ações do Plano
  updateStudyPlan: (
    uid: string,
    courseId: string,
    settings: StudySettings,
    plan: StudyPlan,
  ) => Promise<void>; // <-- courseId adicionado
  setGeneratingPlan: (status: boolean) => void;
  setShowPlanReadyToast: (show: boolean) => void;

  // --- Ações de Vídeo (POR CURSO) ---
  fetchVideoRecs: (
    uid: string,
    courseId: string,
  ) => Promise<CourseYouTubeRecs | null>;
  updateVideoRecs: (
    uid: string,
    courseId: string,
    videos: YouTubeVideo[],
  ) => Promise<void>;

  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoadingProfile: true,
  isGeneratingPlan: false,
  showPlanReadyToast: false,

  fetchProfile: async (uid: string) => {
    set({ isLoadingProfile: true });
    const docRef = doc(db, "users", uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileData = {
          ...defaultProfile,
          ...data,
          coursePlans: data.coursePlans || {},
          youtubeRecs: data.youtubeRecs || {},
          lastDailyCheck: data.lastDailyCheck || null,
          dailyCheckHistory: data.dailyCheckHistory || [],
        };
        set({ profile: profileData as UserProfile, isLoadingProfile: false });
      } else {
        await setDoc(docRef, defaultProfile, { merge: true });
        set({ profile: defaultProfile, isLoadingProfile: false });
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      set({ isLoadingProfile: false });
    }
  },

  updateProfile: async (uid: string, newProfileData: Partial<UserProfile>) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const updatedProfile = { ...currentProfile, ...newProfileData };
    set({ profile: updatedProfile });
    try {
      const docRef = doc(db, "users", uid);
      await setDoc(docRef, newProfileData, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      set({ profile: currentProfile });
    }
  },

  // --- LÓGICA DE OFENSIVA ATUALIZADA ---
  toggleLessonCompleted: async (
    uid: string,
    lessonId: string,
    courseId?: string,
  ) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    // 1. Atualiza a lição
    const newCompleted = new Set(currentProfile.completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId); // Desmarcar
    } else {
      newCompleted.add(lessonId); // Marcar
    }
    const newCompletedArray = Array.from(newCompleted);

    // 2. Lógica da Ofensiva (Streak)
    let newStreak = currentProfile.studyStreak || 0;
    let newLastStreakUpdate = currentProfile.lastStreakUpdate || null;
    const today = formatDate(new Date());

    // Tenta encontrar um plano relevante para hoje
    // Se courseId for passado, olha aquele plano. Se não, itera sobre todos.
    let todayInPlan: StudyPlanDay | undefined;

    if (courseId && currentProfile.coursePlans[courseId]) {
      todayInPlan = currentProfile.coursePlans[courseId].plan.plan.find(
        (day) => day.date === today,
      );
    } else {
      // Procura em qualquer plano se tem aula hoje
      for (const planKey in currentProfile.coursePlans) {
        const day = currentProfile.coursePlans[planKey].plan.plan.find(
          (d) => d.date === today,
        );
        if (day && day.lessons.length > 0) {
          todayInPlan = day;
          break; // Achou um plano com aula hoje
        }
      }
    }

    // Só roda a lógica de streak se o usuário marcou como COMPLETO
    // e se o dia de hoje tem aulas planejadas
    if (
      newCompleted.has(lessonId) &&
      todayInPlan &&
      todayInPlan.lessons.length > 0
    ) {
      // Verifica se TODAS as aulas de hoje (daquele plano encontrado) estão completas
      const allTodayLessonsDone = todayInPlan.lessons.every((lesson) =>
        newCompleted.has(lesson.id),
      );

      // Se todas estão feitas E a ofensiva ainda não foi contada hoje...
      if (allTodayLessonsDone && currentProfile.lastStreakUpdate !== today) {
        newStreak++; // Aumenta a ofensiva!
        newLastStreakUpdate = today; // Marca que já contamos hoje
      }
    }

    // 3. Atualiza o estado local (otimista)
    set({
      profile: {
        ...currentProfile,
        completedLessons: newCompletedArray,
        studyStreak: newStreak,
        lastStreakUpdate: newLastStreakUpdate,
      },
    });

    // 4. Salva no Firebase
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        completedLessons: newCompletedArray,
        studyStreak: newStreak,
        lastStreakUpdate: newLastStreakUpdate,
      });
    } catch (error) {
      console.error("Erro ao salvar progresso/streak:", error);
      set({ profile: currentProfile }); // Reverte em caso de erro
    }
  },

  updateNote: async (uid: string, itemId: string, text: string) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const newNotes = { ...currentProfile.lessonNotes, [itemId]: text };
    set({ profile: { ...currentProfile, lessonNotes: newNotes } });
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { lessonNotes: newNotes });
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      set({ profile: currentProfile });
    }
  },
  resetProgress: async (uid: string) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const newCompletedArray: string[] = [];
    const newNotes = {};
    set({
      profile: {
        ...currentProfile,
        completedLessons: newCompletedArray,
        lessonNotes: newNotes,
      },
    });
    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        completedLessons: newCompletedArray,
        lessonNotes: newNotes,
      });
    } catch (error) {
      console.error("Erro ao resetar progresso:", error);
      set({ profile: currentProfile });
    }
  },

  updateStudyPlan: async (
    uid: string,
    courseId: string,
    settings: StudySettings,
    plan: StudyPlan,
  ) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const newCoursePlans = {
      ...currentProfile.coursePlans,
      [courseId]: { settings, plan },
    };

    const updatedProfile = { ...currentProfile, coursePlans: newCoursePlans };
    set({ profile: updatedProfile });

    try {
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        coursePlans: newCoursePlans,
      });
    } catch (error) {
      console.error("Erro ao salvar plano de estudos:", error);
      set({ profile: currentProfile });
    }
  },

  setGeneratingPlan: (status: boolean) => {
    set({ isGeneratingPlan: status });
  },

  setShowPlanReadyToast: (show: boolean) => {
    set({ showPlanReadyToast: show });
  },

  // --- AÇÕES PARA RECOMENDAÇÕES DE VÍDEO (POR CURSO) ---
  fetchVideoRecs: async (
    uid: string,
    courseId: string,
  ): Promise<CourseYouTubeRecs | null> => {
    // Agora usando a store e documento principal localmente salvo
    const profile = get().profile;

    // Fallback: se o perfil já tiver youtubeRecs local, retorna.
    if (profile?.youtubeRecs?.[courseId]) {
      return profile.youtubeRecs[courseId];
    }

    // Se não tiver local (ou não desceu na sync), busca diretamente do user doc
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.youtubeRecs && data.youtubeRecs[courseId]) {
          return data.youtubeRecs[courseId] as CourseYouTubeRecs;
        }
      }
      return null;
    } catch (error) {
      console.error(
        `Erro ao buscar recomendações do curso ${courseId}:`,
        error,
      );
      return null;
    }
  },

  updateVideoRecs: async (
    uid: string,
    courseId: string,
    videos: YouTubeVideo[],
  ) => {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const newRecs: CourseYouTubeRecs = {
      videos: videos,
      lastUpdated: today,
    };

    const newYoutubeRecs = {
      ...(currentProfile.youtubeRecs || {}),
      [courseId]: newRecs,
    };

    // Atualiza estado local primeiro
    set({
      profile: {
        ...currentProfile,
        youtubeRecs: newYoutubeRecs,
      },
    });

    try {
      // Salva na raiz do documento principal (evita regras de subcoleção bloqueando)
      const docRef = doc(db, "users", uid);
      // Aqui usamos updateDoc em vez de setDoc(merge) por perfomance na key "youtubeRecs"
      await updateDoc(docRef, { youtubeRecs: newYoutubeRecs });
    } catch (error) {
      console.error(
        `Erro ao salvar recomendações de vídeo pro curso ${courseId}:`,
        error,
      );
      // Reverte local em caso de erro
      set({ profile: currentProfile });
    }
  },

  clearProfile: () => {
    set({
      profile: null,
      isLoadingProfile: false,
      isGeneratingPlan: false,
      showPlanReadyToast: false,
    });
  },
}));
