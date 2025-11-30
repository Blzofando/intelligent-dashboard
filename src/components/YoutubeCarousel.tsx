"use client";

import React, { useState, useRef } from 'react';
import { YouTubeVideo } from '@/types';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface YoutubeCarouselProps {
  videos: YouTubeVideo[] | null;
  isLoading: boolean;
  onSelectVideo: (url: string | null) => void;
  focusArea: string;
}

const VideoCard: React.FC<{ video: YouTubeVideo, onClick: () => void }> = ({ video, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    whileTap={{ scale: 0.98 }}
    className="relative shrink-0 w-80 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-lg cursor-pointer group snap-start border border-gray-800 hover:border-primary-500/50 transition-colors"
    onClick={onClick}
  >
    <Image
      src={video.thumbnail}
      alt={video.title}
      width={320}
      height={180}
      className="w-full h-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
      unoptimized
    />
    {/* Overlay e Ícone de Play */}
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors duration-300">
      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/30">
        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
      </div>
    </div>

    {/* Título */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/90 via-black/60 to-transparent">
      <h3 className="text-white text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary-200 transition-colors">
        {video.title}
      </h3>
    </div>
  </motion.div>
);


const YoutubeCarousel: React.FC<YoutubeCarouselProps> = ({ videos, isLoading, onSelectVideo, focusArea }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320 + 24;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 dark:text-primary-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">Filtrando recomendações com IA...</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 max-w-md">
          Não encontramos recomendações no momento. Verifique se o seu <span className='font-bold text-primary-600 dark:text-primary-400'>Foco de Carreira ({focusArea})</span> está definido corretamente.
        </p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Recomendações Semanais
        </h2>
        <span className="text-sm font-medium px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full border border-primary-200 dark:border-primary-800">
          Foco: {focusArea}
        </span>
      </div>

      {/* Viewport */}
      <div className="relative -mx-8 px-8"> {/* Negative margin to allow full-width scroll effect while keeping content aligned */}

        {/* Botão Esquerda */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Container Rolável */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto py-4 snap-x snap-mandatory scrollbar-hide px-2"
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VideoCard
                video={video}
                onClick={() => onSelectVideo(video.embedUrl)}
              />
            </motion.div>
          ))}
          {/* Espaçador final */}
          <div className="shrink-0 w-2 snap-end"></div>
        </div>

        {/* Botão Direita */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default YoutubeCarousel;