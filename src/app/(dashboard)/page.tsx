"use client";

import React, { useMemo, useState, useEffect } from 'react';
import YoutubePlayerModal from '@/components/YoutubePlayerModal';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useCourseContext } from '@/context/CourseProvider';
import { useProfileStore } from '@/store/useProfileStore';
import YoutubeCarousel from '@/components/YoutubeCarousel';
import { YouTubeVideo } from '@/types';
import Link from 'next/link';
import { Clock, BookOpen, Play } from 'lucide-react';
import lessonDurations from '@/data/lessonDurations.json';

const durations: Record<string, number> = lessonDurations;
const PIE_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const PROGRESS_COLORS = ['#2563eb', '#e5e7eb'];

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}m`;
  return result.trim();
}

const Dashboard: React.FC = () => {
  const { profile } = useProfileStore();
  const { course, completedLessons } = useCourseContext();
  
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[] | null>(null);
  const [isLoadingYoutubeVideos, setIsLoadingYoutubeVideos] = useState(true); 
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  const nextLesson = useMemo(() => {
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
    const total = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completed = completedLessons.size;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const categories = [
      { name: "Power Query", ids: ["module-3"] }, { name: "Relacionamentos", ids: ["module-4"] },
      { name: "DAX", ids: ["module-5", "module-11"] }, { name: "Visualização", ids: ["module-6", "module-7", "module-13"] },
      { name: "Online", ids: ["module-8"] },
      { name: "Outros", ids: ["module-1", "module-2", "module-9", "module-10", "module-12", "module-14", "module-15", "module-16", "module-17", "module-18"] },
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

  useEffect(() => {
    const fetchYoutubeRecommendations = async () => {
      if (!profile || !nextLesson) {
        setIsLoadingYoutubeVideos(false);
        return;
      }
      setIsLoadingYoutubeVideos(true);
      try {
        const response = await fetch('/api/gemini/youtube-recs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            focusArea: profile.focusArea || "Sem foco definido",
            nextTopic: nextLesson.title,
            moduleTitle: nextLesson.moduleTitle 
          }),
        });
        if (!response.ok) throw new Error('Falha ao buscar recomendações');
        const videos: YouTubeVideo[] = await response.json();
        setYoutubeVideos(videos);
      } catch (error) {
        console.error(error);
        setYoutubeVideos([]); 
      } finally {
        setIsLoadingYoutubeVideos(false);
      }
    };
    fetchYoutubeRecommendations();
  }, [profile, nextLesson]); 

  const handleSelectVideo = (embedUrl: string | null) => {
    if (embedUrl) setModalVideoUrl(embedUrl);
  };

  return (
    <> 
      <div className="flex flex-col gap-8">
        
        {/* Saudação */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Olá, {profile?.displayName}!
          </h1>
          {nextLesson ? (
            <>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Bora continuar de onde você parou?
              </p>
              <Link 
                href={`/lesson/${nextLesson.id}`} 
                className="group mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-px transform transition-all duration-200"
              >
                <div className="bg-blue-700 p-1.5 rounded-md">
                  <Play className="w-4 h-4" />
                </div>
                <span className="text-sm">
                  Continuar Aula: 
                  <span className="ml-1 font-medium">{nextLesson.title.substring(0, 30)}...</span>
                </span>
              </Link>
            </>
          ) : (
            <p className="mt-4 text-xl font-semibold text-secondary-600 dark:text-secondary-400">
              🎉 Parabéns! Você concluiu todas as aulas do curso!
            </p>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Progresso Geral</h2>
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                    fill="#8884d8" paddingAngle={5} dataKey="value" startAngle={90} endAngle={450}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PROGRESS_COLORS[index % PROGRESS_COLORS.length]} stroke={PROGRESS_COLORS[index % PROGRESS_COLORS.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-gray-800 dark:fill-white">
                    {progressPercentage}%
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
            <Clock className="w-10 h-10 text-primary-500 mb-4" />
            <p className="text-5xl font-bold text-gray-800 dark:text-white">{formatDuration(totalTimeStudied)}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Tempo Total de Estudo</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
            <BookOpen className="w-10 h-10 text-primary-500 mb-4" />
            <p className="text-5xl font-bold text-gray-800 dark:text-white">{completedCount}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Aulas Concluídas</p>
          </div>
        </div>

        {/* --- MUDANÇA: ORDEM TROCADA --- */}

        {/* Carrossel do YouTube (AGORA VEM ANTES) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <YoutubeCarousel 
              videos={youtubeVideos}
              isLoading={isLoadingYoutubeVideos}
              onSelectVideo={handleSelectVideo}
              focusArea={profile?.focusArea || "N/D"}
          />
        </div>

        {/* Gráfico de Donut (AGORA VEM DEPOIS) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Tempo de Estudo por Categoria</h2>
          {totalTimeStudied > 0 ? (
            <div className="w-full h-96"> 
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeByCategory} cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                    fill="#8884d8" paddingAngle={5} dataKey="value"
                  >
                    {timeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatDuration(value)}
                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', borderRadius: '0.5rem'}} 
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Legend 
                    layout="vertical" align="right" verticalAlign="middle" iconType="circle"
                    formatter={(value) => (<span className="text-gray-700 dark:text-gray-300">{value}</span>)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Comece a concluir algumas aulas para ver seu tempo de estudo por categoria!
            </p>
          )}
        </div>
        
      </div>

      {/* O Modal do Vídeo (fica no final) */}
      {modalVideoUrl && (
        <YoutubePlayerModal 
          embedUrl={modalVideoUrl} 
          onClose={() => setModalVideoUrl(null)}
        />
      )}
    </>
  );
};

export default Dashboard;