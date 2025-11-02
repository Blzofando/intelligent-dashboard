"use client";

import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { useCourseContext } from '@/context/CourseProvider';
import { useProfileStore } from '@/store/useProfileStore';
import { getRecommendations } from '@/services/geminiService';
import Link from 'next/link';
import lessonDurations from '@/data/lessonDurations.json'; // Importa o tempo das aulas

const durations: Record<string, number> = lessonDurations;

const PIE_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const PROGRESS_COLORS = ['#2563eb', '#e5e7eb']; // Cor primária e cor de fundo (cinza)

// Função para formatar segundos em "Xh Ym"
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
  
  const [recommendations, setRecommendations] = React.useState('');
  const [isLoadingRecs, setIsLoadingRecs] = React.useState(false);

  const nextLesson = useMemo(() => {
    // Lógica do "Continuar"
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!completedLessons.has(lesson.id)) {
          return { id: lesson.id, title: lesson.title, moduleTitle: module.title };
        }
      }
    }
    return null; 
  }, [course, completedLessons]);

  // --- LÓGICA DAS ESTATÍSTICAS ATUALIZADA ---
  const { totalLessons, completedCount, progressPercentage, totalTimeStudied, timeByCategory } = useMemo(() => {
    const total = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completed = completedLessons.size;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // --- NOVA LÓGICA DO GRÁFICO (Tempo por Categoria) ---
    const categories = [
      { name: "Power Query", ids: ["module-3"] },
      { name: "Relacionamentos", ids: ["module-4"] },
      { name: "DAX", ids: ["module-5", "module-11"] },
      { name: "Visualização", ids: ["module-6", "module-7", "module-13"] },
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
      return {
        name: cat.name,
        value: timeForCategory, // Tempo em segundos
      };
    }).filter(cat => cat.value > 0); // Só mostra categorias que você estudou

    return {
      totalLessons: total,
      completedCount: completed,
      progressPercentage: percentage,
      totalTimeStudied: totalTime, // Tempo total em segundos
      timeByCategory: categoryData,
    };
  }, [course, completedLessons]);
  
  const pieData = [
    { name: 'Completas', value: completedCount },
    { name: 'Restantes', value: totalLessons - completedCount },
  ];

  const handleGetRecommendations = async () => {
      const completedModuleIds = new Set<string>();
      completedLessons.forEach(lessonId => {
          const module = course.modules.find(m => m.lessons.some(l => l.id === lessonId));
          if (module) completedModuleIds.add(module.id);
      });

      const completedModuleTitles = course.modules
          .filter(m => completedModuleIds.has(m.id))
          .map(m => m.title);

      if (completedModuleTitles.length > 0) {
          setIsLoadingRecs(true);
          const recs = await getRecommendations(completedModuleTitles);
          setRecommendations(recs);
          setIsLoadingRecs(false);
      }
  };

  return (
    <div className="space-y-8">
      {/* --- SAUDAÇÃO E BOTÃO CONTINUAR --- */}
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
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-all"
            >
              <i className="fas fa-play"></i>
              Continuar Aula: <span className="font-semibold">{nextLesson.title.substring(0, 30)}...</span>
            </Link>
          </>
        ) : (
          <p className="mt-4 text-xl font-semibold text-secondary-600 dark:text-secondary-400">
            🎉 Parabéns! Você concluiu todas as aulas do curso!
          </p>
        )}
      </div>

      {/* --- PAINEL DE ESTATÍSTICAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico de Pizza (Progresso) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Progresso Geral</h2>
          <div className="w-48 h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
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
        
        {/* Cartão de Tempo Total */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
          <i className="fas fa-clock text-4xl text-primary-500 mb-4"></i>
          <p className="text-5xl font-bold">{formatDuration(totalTimeStudied)}</p>
          <p className="text-gray-500 dark:text-gray-400">Tempo Total de Estudo</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
          <i className="fas fa-book text-4xl text-primary-500 mb-4"></i>
          <p className="text-5xl font-bold">{completedCount}</p>
          <p className="text-gray-500 dark:text-gray-400">Aulas Concluídas</p>
        </div>
      </div>

      {/* --- 3. GRÁFICO DE DONUT (NOVO) --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Tempo de Estudo por Categoria</h2>
        {totalTimeStudied > 0 ? (
          <div className="w-full h-96"> 
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={timeByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80} // O "buraco" do Donut
                  outerRadius={120}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {timeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatDuration(value)} // Formata o tempo
                  contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.9)', 
                    borderColor: '#374151', 
                    borderRadius: '0.5rem'
                  }} 
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span className="text-gray-700 dark:text-gray-300">{value}</span>
                  )}
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

      {/* Recomendações (sem mudança) */}
       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Recomendações da IA</h2>
          {recommendations ? (
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{recommendations}</div>
          ) : (
              <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Complete alguns módulos e clique aqui para receber sugestões de estudo!</p>
                  <button
                      onClick={handleGetRecommendations}
                      disabled={isLoadingRecs || completedLessons.size === 0}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                      {isLoadingRecs ? <><i className="fas fa-spinner fa-spin mr-2"></i>Gerando...</> : <><i className="fas fa-lightbulb mr-2"></i>Gerar Recomendações</>}
                  </button>
              </div>
          )}
       </div>
    </div>
  );
};

export default Dashboard;

