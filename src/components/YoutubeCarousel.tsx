"use client";

// --- MUDANÇA: Importar useRef ---
import React, { useState, useRef } from 'react';
import { YouTubeVideo } from '@/types';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';

interface YoutubeCarouselProps {
  videos: YouTubeVideo[] | null;
  isLoading: boolean;
  onSelectVideo: (url: string | null) => void;
  focusArea: string; 
}

// --- MUDANÇA: VideoCard atualizado (sem descrição) ---
const VideoCard: React.FC<{ video: YouTubeVideo, onClick: () => void }> = ({ video, onClick }) => (
  <div 
    className="relative shrink-0 w-80 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-transform duration-200 hover:shadow-2xl hover:scale-[1.02] group snap-start"
    onClick={onClick}
  >
    <Image 
      src={video.thumbnail} 
      alt={video.title} 
      width={320}
      height={180}
      className="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      unoptimized
    />
    {/* Overlay e Ícone de Play */}
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
      <Play className="w-12 h-12 text-white/90 group-hover:text-white" fill="white" />
    </div>
    {/* Título (sem descrição) */}
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 to-transparent">
      <h3 className="text-white text-sm font-semibold line-clamp-2">{video.title}</h3>
      {/* <p> Descrição removida </p> */}
    </div>
  </div>
);


const YoutubeCarousel: React.FC<YoutubeCarouselProps> = ({ videos, isLoading, onSelectVideo, focusArea }) => {
  // --- MUDANÇA: Lógica de scroll com useRef ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      // Largura de um card (w-80 = 320px) + gap (space-x-6 = 24px)
      const scrollAmount = 320 + 24; 
      
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  // --- FIM DA MUDANÇA ---

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-52 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
            <p className="ml-3 text-gray-600 dark:text-gray-300">Filtrando recomendações com IA...</p>
        </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-52 bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-300">
              Não encontramos recomendações no momento. Verifique se o seu <span className='font-bold'>Foco de Carreira ({focusArea})</span> está definido.
            </p>
        </div>
    );
  }

  // --- MUDANÇA: Layout do Carrossel ---
  return (
    <div className="relative group"> {/* Adicionado 'group' para o hover das setas */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
        Recomendações Semanais (Foco: <span className="text-primary-600 dark:text-primary-400">{focusArea}</span>)
      </h2>

      {/* Viewport (para esconder o scroll e conter as setas) */}
      <div className="relative">
        {/* Container Rolável (com peek) */}
        <div 
          ref={scrollContainerRef}
          className="flex space-x-6 overflow-x-auto py-2 snap-x snap-mandatory scrollbar-hide px-6 -mx-6" // Usa a classe scrollbar-hide e padding para o peek
        >
          {videos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              onClick={() => onSelectVideo(video.embedUrl)} 
            />
          ))}
          {/* Item "fantasma" no final para garantir o espaço do peek */}
           <div className="shrink-0 w-1 snap-end"></div>
        </div>

        {/* Botões de Navegação (Aparecem no hover) */}
        <button 
          onClick={() => handleScroll('left')} 
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-900/70 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <button 
          onClick={() => handleScroll('right')} 
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-900/70 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
        >
          <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
      </div>
    </div>
  );
};

export default YoutubeCarousel;