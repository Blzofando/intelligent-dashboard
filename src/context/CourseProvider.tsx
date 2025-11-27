"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/useProfileStore';
import { getCourseBySlug } from '@/data/courses';
import { Course } from '@/types';
import { useParams } from 'next/navigation';

interface CourseContextType {
  course: Course | null;
  completedLessons: Set<string>;
  notes: Record<string, string>;
  isLoadingProgress: boolean;
  toggleLessonCompleted: (lessonId: string) => void;
  updateNote: (itemId: string, text: string) => void;
  resetProgress: () => void;
}

const CourseContext = createContext<CourseContextType | null>(null);

export const CourseProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const params = useParams();
  const courseSlug = params?.courseId as string | undefined;

  const course = useMemo(() => {
    if (courseSlug) {
      return getCourseBySlug(courseSlug) || null;
    }
    return null;
  }, [courseSlug]);

  const {
    profile,
    isLoadingProfile,
    toggleLessonCompleted: storeToggle,
    updateNote: storeUpdate,
    resetProgress: storeReset
  } = useProfileStore();

  const completedLessons = useMemo(() => new Set(profile?.completedLessons || []), [profile?.completedLessons]);
  const notes = profile?.lessonNotes || {};

  const toggleLessonCompleted = (lessonId: string) => {
    if (user) storeToggle(user.uid, lessonId);
  };

  const updateNote = (itemId: string, text: string) => {
    if (user) storeUpdate(user.uid, itemId, text);
  };

  const resetProgress = () => {
    if (user) storeReset(user.uid);
  };

  const value = {
    course,
    completedLessons,
    notes,
    isLoadingProgress: isLoadingProfile,
    toggleLessonCompleted,
    updateNote,
    resetProgress
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourseContext deve ser usado dentro de um CourseProvider');
  }
  return context;
};