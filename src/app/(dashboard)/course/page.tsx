"use client";

import React, { useMemo } from 'react';
import Link from 'next/link'; 
import { useCourseContext } from '@/context/CourseProvider'; 
import { Module } from '@/types'; 

const ModuleCard: React.FC<{ module: Module, completedLessons: Set<string> }> = ({ module, completedLessons }) => {
  const { progress } = useMemo(() => {
    const completedInModule = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
    const totalLessons = module.lessons.length;
    const progress = totalLessons > 0 ? Math.round((completedInModule / totalLessons) * 100) : 0;
    return { progress };
  }, [module, completedLessons]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate mb-1">{module.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{module.lessons.length} aulas</p>
      
      {/* --- CORREÇÃO DA BARRA DE PROGRESSO --- */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
        {/* Usamos 'style' simples. Isso ignora o linter e funciona. */}
        <div 
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }} 
        ></div>
      </div>
      {/* --- FIM DA CORREÇÃO --- */}
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}% completo</span>
        <Link href={`/module/${module.id}`} className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"> 
          Ver Módulo
        </Link>
      </div>
    </div>
  );
};

const CoursePage: React.FC = () => {
  const { course, completedLessons } = useCourseContext();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Módulos do Curso</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {course.modules.map(module => (
          <ModuleCard key={module.id} module={module} completedLessons={completedLessons} />
        ))}
      </div>
    </div>
  );
};

export default CoursePage;

