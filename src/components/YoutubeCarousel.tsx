"use client";

import React, { useState } from 'react';
import { YouTubeVideo } from '@/types';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';

interface YoutubeCarouselProps {
  videos: YouTubeVideo[] | null;
  isLoading: boolean;
  onSelectVideo: (url: string | null) => void; // Função para abrir o vídeo no modal principal
  focusArea: string; // Usado apenas para exibição
}

// Componente para a visualização de um único cartão de vídeo
const VideoCard: React.FC<{ video: YouTubeVideo, onClick: () => void }> = ({ video, onClick }) => (
  <div 
    className="relative shrink-0 w-80 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-transform duration-200 hover:shadow-2xl hover:scale-[1.02] group"
    onClick={onClick}
  >
    <Image 
      src={video.thumbnail} 
      alt={video.title} 
      width={320} // Largura original
      height={180} // Altura original (proporção 16:9)
      className="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      unoptimized // Para evitar otimização desnecessária em URLs externas
    />
    {/* Overlay e Ícone de Play */}
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
      <Play className="w-12 h-12 text-white/90 group-hover:text-white" fill="white" />
    </div>
    {/* Título e Descrição */}
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
      <h3 className="text-white text-sm font-semibold line-clamp-1">{video.title}</h3>
      <p className="text-gray-300 text-xs mt-1 line-clamp-1">{video.description}</p>
    </div>
  </div>
);


const YoutubeCarousel: React.FC<YoutubeCarouselProps> = ({ videos, isLoading, onSelectVideo, focusArea }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const videosPerView = 3;

    // Limita o slide para não ir além da última visualização
    const maxSlide = videos ? Math.max(0, videos.length - videosPerView) : 0;
    const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, maxSlide));
    const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

    const containerStyle = {
        transform: `translateX(-${currentSlide * (320 + 24)}px)`, // 320px (card width) + 24px (gap-6)
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
                <p className="ml-3 text-gray-600 dark:text-gray-300">Buscando vídeos de apoio...</p>
            </div>
        );
    }

    if (!videos || videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Não encontramos recomendações no momento. Verifique se o seu <span className='font-bold'>Foco de Carreira ({focusArea})</span> está definido.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Recomendações Semanais (Foco: <span className="text-primary-600 dark:text-primary-400">{focusArea}</span>)
            </h2>

            {/* Carrossel Viewport */}
            <div className="overflow-hidden">
                <div 
                    className="flex space-x-6 transition-transform duration-500 ease-in-out py-2" 
                    style={containerStyle}
                >
                    {videos.map((video) => (
                        <VideoCard 
                            key={video.id} 
                            video={video} 
                            onClick={() => onSelectVideo(video.embedUrl)} 
                        />
                    ))}
                </div>
            </div>

            {/* Botões de Navegação */}
            {videos.length > videosPerView && (
                <>
                    <button 
                        onClick={prevSlide} 
                        disabled={currentSlide === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-900/70 p-2 rounded-full shadow-lg disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                    </button>
                    <button 
                        onClick={nextSlide} 
                        disabled={currentSlide >= maxSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-gray-900/70 p-2 rounded-full shadow-lg disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
                    </button>
                </>
            )}
        </div>
    );
};

export default YoutubeCarousel;