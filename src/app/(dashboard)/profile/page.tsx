"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useCourseContext } from "@/context/CourseProvider";
import { auth } from "@/config/firebaseConfig";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { AVATAR_LIST } from "@/data/avatars";
import { UserProfile } from "@/types";
import lessonDurations from "@/data/lessonDurations.json";
import { courses } from "@/data/courses";
import { Camera, KeyRound, Pencil, X } from "lucide-react";

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
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] =
    useState<UserProfile["gender"]>("prefiro-nao-dizer");
  const [avatarPath, setAvatarPath] = useState("");
  const [focusArea, setFocusArea] = useState(""); // <-- ADICIONADO
  const [message, setMessage] = useState({ type: "", text: "" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  // Controle de Modais
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBirthDate(profile.birthDate || "");
      setGender(profile.gender || "prefiro-nao-dizer");
      setAvatarPath(profile.avatarPath);
      setFocusArea(profile.focusArea || ""); // <-- ADICIONADO
      setIsProfileDirty(false);
    }
  }, [profile]);

  // Calcula o progresso INDIVIDUAL de CADA CURSO e o TEMPO TOTAL GLOBAL
  const { allCoursesProgress, totalTimeStudied } = useMemo(() => {
    let globalTimeStudied = 0;
    const coursesProgress: Array<{
      courseName: string;
      percentage: number;
      color: string;
    }> = [];

    // Calcula tempo global (todas as aulas que ele já completou, basta somar do durations.json)
    for (const lessonId of completedLessons) {
      if (durations[lessonId]) {
        globalTimeStudied += durations[lessonId];
      }
    }

    // Calcula progresso individual para todos os cursos da plataforma
    const colors = [
      "bg-primary-600",
      "bg-purple-500",
      "bg-pink-500",
      "bg-blue-500",
    ];
    let colorIdx = 0;

    courses.forEach((course) => {
      const totalLessons = course.modules.reduce(
        (acc, mod) => acc + mod.lessons.length,
        0,
      );

      // Quantas aulas desse curso estão completas?
      const courseLessonIds = new Set(
        course.modules.flatMap((m) => m.lessons.map((l) => l.id)),
      );
      const completedCount = Array.from(completedLessons).filter((id) =>
        courseLessonIds.has(id),
      ).length;

      if (completedCount > 0 && totalLessons > 0) {
        const percentage = Math.round((completedCount / totalLessons) * 100);
        coursesProgress.push({
          courseName: course.title,
          percentage,
          color: colors[colorIdx % colors.length],
        });
        colorIdx++;
      }
    });

    return {
      allCoursesProgress: coursesProgress,
      totalTimeStudied: formatDuration(globalTimeStudied),
    };
  }, [completedLessons]);

  const sortedAvatars = useMemo(() => {
    // ... (lógica dos avatares, sem mudança)
    const { masculino, feminino, outros } = AVATAR_LIST;
    if (gender === "masculino") return [...masculino, ...outros, ...feminino];
    if (gender === "feminino") return [...feminino, ...outros, ...masculino];
    return [...outros, ...masculino, ...feminino];
  }, [gender]);

  const handleProfileChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    value: any,
  ) => {
    setter(value);
    setIsProfileDirty(true);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProfileSaving(true);
    setMessage({ type: "", text: "" });

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
    setIsAvatarModalOpen(false); // Fecha o modal após salvar se estava aberto
    setMessage({ type: "success", text: "Perfil salvo com sucesso!" });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    // ... (função sem alteração)
    e.preventDefault();
    if (!user || !user.email) {
      setMessage({ type: "error", text: "Usuário não encontrado." });
      return;
    }

    setIsPasswordSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setIsPasswordModalOpen(false); // Fecha o modal
    } catch (error: any) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Erro ao alterar a senha. Verifique sua senha atual.",
      });
    }

    setIsPasswordSaving(false);
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleResetProgress = () => {
    // ... (função sem alteração)
    if (
      window.confirm(
        "Você tem certeza? Todo o seu progresso de aulas e anotações será apagado permanentemente.",
      )
    ) {
      resetProgress();
      setMessage({ type: "success", text: "Seu progresso foi resetado." });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        Meu Perfil
      </h1>

      {message.text && (
        <div
          className={`p-4 rounded-lg mb-2 text-sm font-semibold ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              : "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* --- ESTATÍSTICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
            Progresso dos Seus Cursos
          </h2>

          {allCoursesProgress.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Você ainda não iniciou nenhum curso.
            </p>
          ) : (
            <div className="space-y-6">
              {allCoursesProgress.map((courseProg, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {courseProg.courseName}
                    </span>
                    <span
                      className={`font-bold ${courseProg.color.replace("bg-", "text-")}`}
                    >
                      {courseProg.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`${courseProg.color} h-3 rounded-full transition-all duration-1000`}
                      style={{ width: `${courseProg.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            <Pencil className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tempo Total de Estudo
          </p>
          <p className="text-5xl font-extrabold text-gray-800 dark:text-white mt-3">
            {totalTimeStudied}
          </p>
        </div>
      </div>

      {/* --- ATUALIZAR PERFIL (Firestore) --- */}
      <form
        onSubmit={handleProfileUpdate}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex flex-col gap-8"
      >
        <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Informações Públicas
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Essas informações poderão ser vistas por outras pessoas do
              sistema.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Image
                src={avatarPath}
                alt="Avatar Atual"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-500 transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Campos de Texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nome (Apelido)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) =>
                handleProfileChange(setDisplayName, e.target.value)
              }
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birthDate"
              value={birthDate}
              onChange={(e) =>
                handleProfileChange(setBirthDate, e.target.value)
              }
              className="mt-1 block w-full rounded-md shadow-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Gênero (para avatares)
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) =>
                handleProfileChange(
                  setGender,
                  e.target.value as UserProfile["gender"],
                )
              }
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
            <label
              htmlFor="focusArea"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              Foco de Carreira
            </label>
            <input
              type="text"
              id="focusArea"
              value={focusArea}
              onChange={(e) =>
                handleProfileChange(setFocusArea, e.target.value)
              }
              placeholder='Ex: "Vendas", "RH", "Produção"'
              className="px-4 py-2 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:border-primary-500 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-800 outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            Alterar Senha de Acesso
          </button>

          <button
            type="submit"
            disabled={!isProfileDirty || isProfileSaving}
            className={`px-8 py-3 font-bold text-white rounded-xl shadow-lg transition-all ${
              isProfileDirty
                ? "bg-primary-600 hover:bg-primary-500 hover:scale-105 hover:shadow-primary-500/25"
                : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-70"
            }`}
          >
            {isProfileSaving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Salvando...
              </>
            ) : (
              "Salvar Perfil"
            )}
          </button>
        </div>
      </form>

      {/* --- ATUALIZAR SENHA (Auth) --- */}

      {/* --- ZONA DE PERIGO (NOVO) --- */}
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-500 p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
          Zona de Perigo
        </h2>
        <p className="text-sm text-red-600 dark:text-red-200">
          Cuidado, esta ação é irreversível. Isso apagará todo o seu progresso
          de aulas e anotações.
        </p>
        <button
          onClick={handleResetProgress}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <i className="fas fa-trash mr-2"></i>
          Resetar Progresso do Curso
        </button>
      </div>

      {/* --- MODAIS DE UI --- */}

      {/* Modal de Avatares */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 mt-20 md:mt-0">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Escolha um novo Avatar
              </h3>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="flex flex-wrap justify-center gap-4">
                {sortedAvatars.map((path) => (
                  <button
                    type="button"
                    key={path}
                    onClick={() => handleProfileChange(setAvatarPath, path)}
                    className={`relative outline-hidden rounded-full transition-all duration-300 ${avatarPath === path ? "ring-4 ring-primary-500 scale-110 shadow-xl z-10" : "hover:scale-105 opacity-80 hover:opacity-100 hover:shadow-lg"}`}
                  >
                    <Image
                      src={path}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    {avatarPath === path && (
                      <div className="absolute inset-0 rounded-full border border-black/10 dark:border-white/10"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-6 py-2.5 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Confirmar Escoha (Salvar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Senha */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handlePasswordChange}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <KeyRound className="w-5 h-5 text-primary-600 text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Alterar Senha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >
                  Senha Atual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:border-primary-500 focus:ring-primary-500 transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nova Senha
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:border-primary-500 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-5 py-2.5 font-semibold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPasswordSaving || !currentPassword || !newPassword}
                className="px-6 py-2.5 font-bold bg-primary-600 text-white rounded-xl hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg"
              >
                {isPasswordSaving ? "Processando..." : "Salvar Nova Senha"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
