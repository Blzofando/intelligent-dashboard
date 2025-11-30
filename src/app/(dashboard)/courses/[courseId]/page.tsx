
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import YoutubePlayerModal from '@/components/YoutubePlayerModal';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useCourseContext } from '@/context/CourseProvider';
import { useProfileStore } from '@/store/useProfileStore';
import YoutubeCarousel from '@/components/YoutubeCarousel';
import { YouTubeVideo } from '@/types';
import Link from 'next/link';
import { Clock, BookOpen, Play, Sparkles, Trophy, Target } from 'lucide-react';
import lessonDurations from '@/data/lessonDurations.json';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { StudyPlannerModal } from '@/components/StudyPlannerModal';

// --- (Sem alterações nas funções e constantes de estatística) ---
const durations: Record<string, number> = lessonDurations;
// Cores mais modernas e vibrantes para os gráficos
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
const PROGRESS_COLORS = ['#3b82f6', '#e5e7eb'];

function formatDuration(totalSeconds: number): string {
    if (!totalSeconds) return "0m";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours === 0) result += `${minutes}m`;
    return result.trim();
}
// --- FIM (Sem alterações) ---


const Dashboard: React.FC = () => {
    const { profile } = useProfileStore();
    const { course, completedLessons } = useCourseContext();

    const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[] | null>(null);
    const [isLoadingYoutubeVideos, setIsLoadingYoutubeVideos] = useState(true);
    const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);
    const [showStudyPlanner, setShowStudyPlanner] = useState(false);

    // Handle null course
    if (!course) {
        return <div className="p-8 text-center text-gray-600 dark:text-gray-300">Carregando curso...</div>;
    }

    // Check if plan exists for this course
    useEffect(() => {
        if (profile && !profile.coursePlans[course.id]) {
            // Se não tem plano para este curso, abre o modal
            // Pequeno delay para garantir que o perfil carregou
            const timer = setTimeout(() => setShowStudyPlanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [profile, course.id]);

    const nextLesson = useMemo(() => {
        // ... (Sem alterações) ...
        for (const module of course.modules) {
            for (const lesson of module.lessons) {
                if (!completedLessons.has(lesson.id)) {
                    return { id: lesson.id, title: lesson.title, moduleTitle: module.title };
                }
            }
        }
        return null;
    }, [course, completedLessons]);

    const { totalLessons, completedCount, progressPercentage, totalTimeStudied, timeByCategory } = useMemo(() => {
        // ... (Lógica de estatísticas, sem alterações) ...
        const total = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);

        // Filter completed lessons to only include those that belong to this course
        const courseLessonIds = new Set(course.modules.flatMap(m => m.lessons.map(l => l.id)));
        const completed = Array.from(completedLessons).filter(id => courseLessonIds.has(id)).length;

        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const categories = course.categories
            ? course.categories.map(c => ({ name: c.name, ids: c.moduleIds }))
            : [
                { name: "Geral", ids: course.modules.map(m => m.id) }
            ];
        let totalTime = 0;
        const categoryData = categories.map(cat => {
            let timeForCategory = 0;
            cat.ids.forEach(modId => {
                const module = course.modules.find(m => m.id === modId);
                if (module) {
                    module.lessons.forEach(lesson => {
                        if (completedLessons.has(lesson.id) && durations[lesson.id]) {
                            timeForCategory += durations[lesson.id];
                        }
                    });
                }
            });
            totalTime += timeForCategory;
            return { name: cat.name, value: timeForCategory };
        }).filter(cat => cat.value > 0);
        return {
            totalLessons: total, completedCount: completed, progressPercentage: percentage,
            totalTimeStudied: totalTime, timeByCategory: categoryData,
        };
    }, [course, completedLessons]);

    const pieData = [
        { name: 'Completas', value: completedCount },
        { name: 'Restantes', value: totalLessons - completedCount },
    ];

    // --- MUDANÇA: LÓGICA DE CACHE SEMANAL ---
    useEffect(() => {
        const fetchYoutubeRecommendations = async () => {
            if (!profile || !nextLesson) {
                setIsLoadingYoutubeVideos(false);
                return;
            }

            const focus = profile.focusArea || "Sem foco definido";
            const module = nextLesson.moduleTitle;

            // 1. Criar uma chave de cache única para este módulo e foco
            const CACHE_KEY = `youtubeRecs_${module}_${focus}`;
            const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

            // 2. Tentar ler do cache
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                const { videos, timestamp } = JSON.parse(cachedData);
                const isStale = (Date.now() - timestamp) > CACHE_DURATION;

                if (!isStale) {
                    setYoutubeVideos(videos); // Usa o cache
                    setIsLoadingYoutubeVideos(false);
                    return; // Para aqui, não busca na API
                }
            }

            // 3. Se o cache não existe ou está velho, buscar na API
            setIsLoadingYoutubeVideos(true);
            try {
                const response = await fetch('/api/gemini/youtube-recs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        focusArea: focus,
                        nextTopic: nextLesson.title,
                        moduleTitle: module
                    }),
                });

                if (!response.ok) throw new Error('Falha ao buscar recomendações');

                const videos: YouTubeVideo[] = await response.json();
                setYoutubeVideos(videos);

                // 4. Salvar os novos resultados e o timestamp no cache
                const newCacheData = {
                    videos: videos,
                    timestamp: Date.now()
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(newCacheData));

            } catch (error) {
                console.error(error);
                setYoutubeVideos([]); // Define como vazio em caso de erro
            } finally {
                setIsLoadingYoutubeVideos(false);
            }
        };

        fetchYoutubeRecommendations();
        // As dependências garantem que a busca rode se o usuário mudar de módulo
    }, [profile, nextLesson]);
    // --- FIM DA MUDANÇA ---

    const handleSelectVideo = (embedUrl: string | null) => {
        if (embedUrl) setModalVideoUrl(embedUrl);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-8 max-w-7xl mx-auto"
            >

                {/* Saudação e Próxima Aula */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 p-8 md:p-10 shadow-2xl"
                >
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-blue-100 mb-2">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <span className="text-sm font-medium uppercase tracking-wider">Painel do Aluno</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Olá, {profile?.displayName?.split(' ')[0]}!
                            </h1>
                            <p className="text-blue-100 text-lg max-w-xl">
                                {nextLesson
                                    ? "Pronto para continuar sua jornada de aprendizado? Sua próxima aula está te esperando."
                                    : "Parabéns! Você completou todas as aulas deste curso."}
                            </p>
                        </div>

                        {nextLesson && (
                            <Link
                                href={`/courses/${course.slug}/lesson/${nextLesson.id}`}
                                className="group relative inline-flex items-center gap-3 px-6 py-4 bg-white text-blue-600 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                <div className="absolute inset-0 rounded-xl bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                                </div>
                                <div className="relative flex flex-col items-start">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Continuar Aula</span>
                                    <span className="text-sm leading-tight line-clamp-1 max-w-[200px]">{nextLesson.title}</span>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            </Link>
                        )}
                    </div>
                </motion.div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-transparent dark:from-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h2 className="text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300 z-10">Progresso Geral</h2>
                        <div className="w-40 h-40 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={70}
                                        fill="#8884d8" paddingAngle={5} dataKey="value" startAngle={90} endAngle={450}
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PROGRESS_COLORS[index % PROGRESS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-gray-800 dark:text-white">{progressPercentage}%</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-purple-50 to-transparent dark:from-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white mb-1">{formatDuration(totalTimeStudied)}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tempo de Estudo</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-green-50 to-transparent dark:from-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white mb-1">{completedCount}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aulas Concluídas</p>
                    </motion.div>
                </div>

                {/* Carrossel do YouTube */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                >
                    <YoutubeCarousel
                        videos={youtubeVideos}
                        isLoading={isLoadingYoutubeVideos}
                        onSelectVideo={handleSelectVideo}
                        focusArea={profile?.focusArea || "N/D"}
                    />
                </motion.div>

                {/* Gráfico de Donut */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tempo de Estudo por Categoria</h2>
                    </div>

                    {totalTimeStudied > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={timeByCategory} cx="50%" cy="50%" innerRadius={80} outerRadius={110}
                                        fill="#8884d8" paddingAngle={5} dataKey="value"
                                        stroke="none"
                                    >
                                        {timeByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatDuration(value)}
                                        contentStyle={{
                                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#e5e7eb' }}
                                    />
                                    <Legend
                                        layout="vertical" align="right" verticalAlign="middle" iconType="circle"
                                        formatter={(value) => (<span className="text-gray-600 dark:text-gray-300 font-medium ml-2">{value}</span>)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Comece a concluir algumas aulas para ver seu tempo de estudo distribuído por categoria!
                            </p>
                        </div>
                    )}
                </motion.div>

            </motion.div>

            {/* O Modal do Vídeo (fica no final) */}
            {modalVideoUrl && (
                <YoutubePlayerModal
                    embedUrl={modalVideoUrl}
                    onClose={() => setModalVideoUrl(null)}
                />
            )}

            {/* Modal de Plano de Estudos */}
            <StudyPlannerModal
                isOpen={showStudyPlanner}
                onClose={() => setShowStudyPlanner(false)}
                courseId={course.id}
            />
        </>
    );
};

export default Dashboard;
