import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { UserProfile, StudyPlan, StudySettings } from '@/types';

// Valores padrão para um novo usuário
const defaultProfile: UserProfile = {
  displayName: "Novo Aluno",
  avatarPath: "/avatars/outros/o-01.png",
  gender: "prefiro-nao-dizer",
  birthDate: "",
  focusArea: "Sem foco definido", // <-- ADICIONADO
  completedLessons: [], 
  lessonNotes: {},
  studySettings: null, 
  studyPlan: null,     
  studyStreak: 0,      
};

interface ProfileState {
  profile: UserProfile | null;
  isLoadingProfile: boolean; 
  fetchProfile: (uid: string) => Promise<void>;
  updateProfile: (uid: string, newProfileData: Partial<UserProfile>) => Promise<void>;
  
  // Ações de progresso (sem alteração)
  toggleLessonCompleted: (uid: string, lessonId: string) => Promise<void>;
  updateNote: (uid: string, itemId: string, text: string) => Promise<void>;
  resetProgress: (uid: string) => Promise<void>;
  
  // Nova ação para salvar o plano
  updateStudyPlan: (uid: string, settings: StudySettings, plan: StudyPlan) => Promise<void>;
  
  clearProfile: () => void; 
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoadingProfile: true, 
  
  fetchProfile: async (uid: string) => {
    set({ isLoadingProfile: true }); 
    const docRef = doc(db, 'users', uid);
    
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Mescla os dados do DB com os padrões (para garantir que 'focusArea' exista)
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
    // ... (função sem alteração)
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

  // --- Funções de Progresso (sem alteração) ---
  toggleLessonCompleted: async (uid: string, lessonId: string) => {
    // ... (função sem alteração)
    const currentProfile = get().profile;
    if (!currentProfile) return;
    const newCompleted = new Set(currentProfile.completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    const newCompletedArray = Array.from(newCompleted);
    set({ profile: { ...currentProfile, completedLessons: newCompletedArray } });
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { completedLessons: newCompletedArray });
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
      set({ profile: currentProfile }); 
    }
  },
  updateNote: async (uid: string, itemId: string, text: string) => {
    // ... (função sem alteração)
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
    // ... (função sem alteração)
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
  
  // --- NOVA FUNÇÃO ---
  updateStudyPlan: async (uid: string, settings: StudySettings, plan: StudyPlan) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;
    
    // Atualiza o estado local
    const updatedProfile = { ...currentProfile, studySettings: settings, studyPlan: plan };
    set({ profile: updatedProfile });

    // Salva no Firestore
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { 
        studySettings: settings,
        studyPlan: plan
      });
    } catch (error) {
      console.error("Erro ao salvar plano de estudos:", error);
      set({ profile: currentProfile }); // Reverte em caso de erro
    }
  },

  clearProfile: () => {
    // ... (função sem alteração)
    set({ profile: null, isLoadingProfile: false }); 
  }
}));