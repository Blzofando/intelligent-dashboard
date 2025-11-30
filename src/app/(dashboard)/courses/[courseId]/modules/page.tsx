"use client";

import React from 'react';
import { useCourseContext } from '@/context/CourseProvider';
import ModuleCard from '@/components/ModuleCard';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

export default function ModulesPage() {
  const { course } = useCourseContext();

  if (!course) {
    return <div className="p-8 text-center text-gray-600 dark:text-gray-300 animate-pulse">Carregando módulos...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Módulos do Curso
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Explore o conteúdo e acompanhe seu progresso
          </p>
        </div >
      </motion.div >

      <div className="grid gap-6">
        {course.modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <ModuleCard
              module={module}
              courseId={course.slug} // Usando slug para URL amigável se disponível, ou id
            />
          </motion.div>
        ))}
      </div>

      {
        course.modules.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">Nenhum módulo encontrado para este curso.</p>
          </div>
        )
      }
    </div >
  );
}
