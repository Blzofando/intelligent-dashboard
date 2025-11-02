"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ lessonId, lessonTitle, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Lê a URL da API de streaming (do seu backend Python)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  // O ID da aula (ex: "F001") é usado para buscar o vídeo
  // Isso remove "lesson-" ou "#" caso existam
  const aulaCode = lessonId.replace('lesson-', '').replace('#', '');
  const videoUrl = `${API_URL}/stream/code/${aulaCode}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reseta o estado para cada nova aula
    setIsLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      video.play(); // Inicia o play automaticamente
      setIsPlaying(true);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return; // Evita divisão por zero
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);

      // Marca como completa quando chegar a 90% do vídeo
      if (onComplete && (video.currentTime / video.duration) > 0.9) {
        onComplete();
      }
    };

    const handleError = () => {
      setError('Erro ao carregar o vídeo. Verifique se o servidor Python (backend) está rodando.');
      setIsLoading(false);
    };
    
    const handleWaiting = () => setIsLoading(true); // Mostra loading se o buffer acabar
    const handlePlaying = () => setIsLoading(false); // Esconde loading

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoUrl, onComplete]); // Recarrega o efeito se a URL (aula) mudar

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (video.requestFullscreen) {
        video.requestFullscreen();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-2xl">
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={togglePlay}
        key={videoUrl} // Força o React a recriar o elemento quando o src muda
      />

      {/* Overlay de Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 pointer-events-none">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Carregando aula...</p>
          </div>
        </div>
      )}

      {/* Overlay de Erro */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
          <div className="text-center text-white p-6">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2">Ops! Algo deu errado</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                videoRef.current?.load();
              }}
              className="px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}

      {/* Controles Customizados */}
      {/* Correção: bg-gradient-to-t -> bg-linear-to-t (Tailwind v4) */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        {/* Barra de Progresso */}
        <div
          onClick={handleProgressClick}
          className="w-full h-1.5 bg-gray-700/50 rounded-full cursor-pointer mb-3 group transition-all duration-150 hover:h-2.5"
        >
          <div
            className="h-full bg-primary-600 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="hover:text-primary-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="hover:text-primary-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Tempo */}
            <span className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-primary-400 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

