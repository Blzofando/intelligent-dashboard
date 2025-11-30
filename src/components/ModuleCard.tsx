"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Module } from '@/types';
import { useCourseContext } from '@/context/CourseProvider';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ModuleCardProps {
    module: Module;
    courseId: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, courseId }) => {
    const { completedLessons } = useCourseContext();

    const { progress, completedCount, totalLessons } = useMemo(() => {
        const completedInModule = module.lessons.filter(lesson => completedLessons.has(lesson.id)).length;
        const total = module.lessons.length;
        const prog = total > 0 ? Math.round((completedInModule / total) * 100) : 0;
        return { progress: prog, completedCount: completedInModule, totalLessons: total };
    }, [module, completedLessons]);

    const isCompleted = progress === 100;

    return (
        <Link
            href={`/courses/${courseId}/module/${module.id}`}
            className="group block h-full"
        >
            <div className={clsx(
                "relative h-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border transition-all duration-300 overflow-hidden",
                isCompleted
                    ? "border-green-200 dark:border-green-900/30 hover:shadow-green-500/10"
                    : "border-gray-100 dark:border-gray-700 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5"
            )}>
                {/* Background Gradient Effect */}
                <div className={clsx(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    isCompleted
                        ? "bg-linear-to-br from-green-50/50 to-transparent dark:from-green-900/10"
                        : "bg-linear-to-br from-primary-50/50 to-transparent dark:from-primary-900/10"
                )} />

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                        <div className={clsx(
                            "p-3 rounded-xl transition-colors duration-300",
                            isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40"
                        )}>
                            {isCompleted ? <CheckCircle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                        </div>
                        <div className={clsx(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        )}>
                            {completedCount}/{totalLessons} Aulas
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {module.title}
                    </h3>

                    <div className="mt-auto pt-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Progresso</span>
                            <span className={clsx(
                                "font-bold",
                                isCompleted ? "text-green-600 dark:text-green-400" : "text-primary-600 dark:text-primary-400"
                            )}>{progress}%</span>
                        </div>

                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={clsx(
                                    "h-full rounded-full",
                                    isCompleted ? "bg-green-500" : "bg-primary-500"
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors pt-2">
                            <span>{isCompleted ? "Revisar Módulo" : "Continuar Estudando"}</span>
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ModuleCard;
