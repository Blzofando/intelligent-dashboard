import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { UserProfile, StudyPlan, StudySettings, YouTubeVideo, StudyPlanDay } from '@/types'; // Importa StudyPlanDay

// --- Helper: Formatar Data ---
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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
  studySettings: null, 
  studyPlan: null,     
  studyStreak: 0,
  lastStreakUpdate: null, // <-- ADICIONADO
  videoRecommendations: null,
  videoRecsLastUpdated: null,
};

interface ProfileState {
  profile: UserProfile | null;
  isLoadingProfile: boolean; 
  isGeneratingPlan: boolean;
  showPlanReadyToast: boolean;
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (uid: string, newProfileData: Partial<UserProfile>) => Promise<void>;
  
  // Ações de progresso
  toggleLessonCompleted: (uid: string, lessonId: string) => Promise<void>; // <-- LÓGICA ATUALIZADA
  updateNote: (uid: string, itemId: string, text: string) => Promise<void>;
  resetProgress: (uid: string) => Promise<void>;
  
  // Ações do Plano
  updateStudyPlan: (uid: string, settings: StudySettings, plan: StudyPlan) => Promise<void>;
  setGeneratingPlan: (status: boolean) => void; 
  setShowPlanReadyToast: (show: boolean) => void;
  
  updateVideoRecs: (uid: string, videos: YouTubeVideo[]) => Promise<void>; 
  clearProfile: () => void; 
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoadingProfile: true, 
  isGeneratingPlan: false,
  showPlanReadyToast: false,

  fetchProfile: async (uid: string) => {
    // ... (sem alteração) ...
    set({ isLoadingProfile: true }); 
    const docRef = doc(db, 'users', uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profileData = { ...defaultProfile, ...docSnap.data() };
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
    // ... (sem alteração) ...
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const updatedProfile = { ...currentProfile, ...newProfileData };
    set({ profile: updatedProfile }); 
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, newProfileData, { merge: true }); 
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      set({ profile: currentProfile }); 
    }
  },

  // --- LÓGICA DE OFENSIVA ATUALIZADA ---
  toggleLessonCompleted: async (uid: string, lessonId: string) => {
    const currentProfile = get().profile;
    if (!currentProfile || !currentProfile.studyPlan) return;

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
    
    // Pega o dia de hoje no plano
    const todayInPlan = currentProfile.studyPlan.plan.find(day => day.date === today);

    // Só roda a lógica de streak se o usuário marcou como COMPLETO
    // e se o dia de hoje tem aulas planejadas
    if (newCompleted.has(lessonId) && todayInPlan && todayInPlan.lessons.length > 0) {
      
      // Verifica se TODAS as aulas de hoje estão completas
      const allTodayLessonsDone = todayInPlan.lessons.every(lesson => 
        newCompleted.has(lesson.id)
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
        lastStreakUpdate: newLastStreakUpdate
      } 
    });
    
    // 4. Salva no Firebase
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { 
        completedLessons: newCompletedArray,
        studyStreak: newStreak,
        lastStreakUpdate: newLastStreakUpdate
      });
    } catch (error) {
      console.error("Erro ao salvar progresso/streak:", error);
      set({ profile: currentProfile }); // Reverte em caso de erro
    }
  },

  updateNote: async (uid: string, itemId: string, text: string) => {
    // ... (sem alteração) ...
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const newNotes = { ...currentProfile.lessonNotes, [itemId]: text };
    set({ profile: { ...currentProfile, lessonNotes: newNotes } });
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { lessonNotes: newNotes });
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      set({ profile: currentProfile }); 
    }
  },
  resetProgress: async (uid: string) => {
    // ... (sem alteração) ...
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const newCompletedArray: string[] = [];
    const newNotes = {};
    set({ profile: { ...currentProfile, completedLessons: newCompletedArray, lessonNotes: newNotes } });
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { 
        completedLessons: newCompletedArray,
        lessonNotes: newNotes 
      });
    } catch (error) {
      console.error("Erro ao resetar progresso:", error);
      set({ profile: currentProfile }); 
    }
  },
  
 updateStudyPlan: async (uid: string, settings: StudySettings, plan: StudyPlan) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    
    const updatedProfile = { ...currentProfile, studySettings: settings, studyPlan: plan };
    set({ profile: updatedProfile });

    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { 
        studySettings: settings,
        studyPlan: plan
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

  // --- NOVA FUNÇÃO PARA CACHE DE VÍDEOS ---
  updateVideoRecs: async (uid: string, videos: YouTubeVideo[]) => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const newRecs = {
      videoRecommendations: videos,
      videoRecsLastUpdated: today
    };

    set(state => ({
      profile: state.profile ? { ...state.profile, ...newRecs } : null
    }));

    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, newRecs);
    } catch (error) {
      console.error("Erro ao salvar recomendações de vídeo:", error);
    }
  },

  clearProfile: () => {
    set({ 
      profile: null, 
      isLoadingProfile: false, 
      isGeneratingPlan: false, 
      showPlanReadyToast: false 
    }); 
  }
}));