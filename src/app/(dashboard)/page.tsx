"use client";

import React from 'react';
import Link from 'next/link';
import { courses } from '@/data/courses';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function AllCoursesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Cursos</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Selecione um curso para continuar seus estudos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="aspect-video relative bg-gray-100 dark:bg-gray-700">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {course.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {course.description || "Acesse o conteúdo completo deste curso."}
              </p>

              <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                Acessar Curso
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}