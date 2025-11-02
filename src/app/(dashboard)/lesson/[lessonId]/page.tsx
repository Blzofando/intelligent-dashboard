// src/app/(dashboard)/lesson/[lessonId]/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCourseContext } from '@/context/CourseProvider';

const LessonPlayerPage: React.FC = () => {
  const params = useParams();
  const lessonId = params.lessonId as string; 

  const { course } = useCourseContext();

  // Encontra a aula e o módulo (apenas para o título)
  const lesson = course.modules
    .flatMap(m => m.lessons)
    .find(l => l.id === lessonId);

  return (
    <div className="space-y-6">
      <Link href="/course" className="text-primary-500 hover:underline">
        &larr; Voltar para os Módulos
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
        {lesson ? lesson.title : "Carregando..."}
      </h1>

      {/* Placeholder para a sua solução de streaming */}
      <div className="aspect-video w-full rounded-lg bg-gray-800 shadow-lg flex items-center justify-center text-gray-400">
        <div className="text-center">
            <i className="fas fa-video-slash text-4xl mb-4"></i>
            <h2 className="text-xl font-semibold">Player de Vídeo (Em Breve)</h2>
            <p>A nova solução de streaming será integrada aqui.</p>
        </div>
      </div>

    </div>
  );
};

export default LessonPlayerPage;