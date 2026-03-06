"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  AlertCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  onComplete?: () => void;
  onNextLesson?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lessonId,
  lessonTitle,
  onComplete,
  onNextLesson,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Referência para a div principal (Fullscreen)
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Lê a URL da API de streaming (do seu backend Python)
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://telegram-streamer.fly.dev";

  // O ID da aula (ex: "F001") é usado para buscar o vídeo
  // Isso remove "lesson-" ou "#" caso existam
  const aulaCode = lessonId.replace("lesson-", "").replace("#", "");
  const videoUrl = `${API_URL}/stream/code/${aulaCode}`;

  useEffect(() => {
    // Tenta entrar em fullscreen automaticamente se a flag estiver ativa
    if (sessionStorage.getItem("resumeFullscreen") === "true") {
      sessionStorage.removeItem("resumeFullscreen");
      setTimeout(() => {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch((err) => {
            console.log("Erro ao tentar manter fullscreen:", err);
          });
        }
      }, 500);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reseta o estado para cada nova aula
    setIsLoading(true);
    setError(null);
    setShowAutoNext(false); // Reset auto-next state

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      video.play(); // Inicia o play automaticamente
      setIsPlaying(true);
      video.playbackRate = playbackRate; // Apply current playback rate
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return; // Evita divisão por zero
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);

      // Marca como completa quando faltarem 30 segundos para terminar o vídeo
      if (onComplete && video.duration - video.currentTime <= 30) {
        onComplete();
      }

      // Mostra o Auto-Next (caso exista próxima aula) quando o vídeo chegar nos 30 segundos finais
      if (
        onNextLesson &&
        video.duration > 0 &&
        video.duration - video.currentTime <= 30
      ) {
        setShowAutoNext(true);
      } else {
        setShowAutoNext(false);
      }
    };

    const handleError = () => {
      setError(
        "Erro ao carregar o vídeo. Verifique se o servidor Python (backend) está rodando.",
      );
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true); // Mostra loading se o buffer acabar
    const handlePlaying = () => setIsLoading(false); // Esconde loading

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos se o foco estiver em um input ou textarea (para evitar interferência com outros componentes)
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault(); // Evita a rolagem da página
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(15);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-15);
          break;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Adicionar keydown event globalmente ou localmente
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [videoUrl, onComplete, onNextLesson, playbackRate]); // Recarrega o efeito se a URL (aula) mudar

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

  // Lida com exibição/ocultação de controles com ociosidade do mouse
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettings(false); // fecha popups também
      }
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
      setShowSettings(false);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      handleMouseMove();
    }
  }, [isPlaying]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const skipTime = (amount: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + amount),
    );
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-lg overflow-hidden bg-black shadow-2xl flex items-center justify-center group/container ${!showControls && isPlaying ? "cursor-none" : ""}`}
    >
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={togglePlay}
        key={videoUrl} // Força o React a recriar o elemento quando o src muda
        playsInline
      />

      {/* Botão Flutuante Auto-Next (Substitui o overlay invasivo) */}
      {showAutoNext && onNextLesson && (
        <div
          className={`absolute right-4 bottom-20 z-40 transition-opacity duration-300 ${
            showControls
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none translate-y-2"
          }`}
        >
          <button
            onClick={() => {
              if (isFullscreen) {
                sessionStorage.setItem("resumeFullscreen", "true");
              }
              onNextLesson();
            }}
            className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-black/50 font-semibold tracking-wide transition-all hover:scale-105 active:scale-95"
          >
            Próxima Aula
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overlay de Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/75 pointer-events-none z-10">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Carregando aula...</p>
          </div>
        </div>
      )}

      {/* Overlay de Erro */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
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
      {/* Ajustado o z-index para 40 para ficar acima do erro/loading mas garantir que ele não fica abaixo de nada no fullscreen */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 z-40 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Barra de Progresso */}
        <div
          onClick={handleProgressClick}
          className="w-full h-1.5 bg-gray-600/50 rounded-full cursor-pointer mb-3 group transition-all duration-150 hover:h-2.5"
        >
          <div
            className="h-full bg-primary-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Backward */}
            <button
              onClick={() => skipTime(-15)}
              className="hover:text-primary-400 transition-colors flex items-center justify-center relative w-10 h-10 group/btn"
              title="Voltar 15s"
            >
              <RotateCcw
                className="w-7 h-7 text-white group-hover/btn:text-primary-400 transition-colors"
                strokeWidth={1.5}
              />
              <span className="absolute text-[8px] font-bold mt-[1px] text-white group-hover/btn:text-primary-400 transition-colors">
                15
              </span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="hover:text-primary-400 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 fill-current" />
              )}
            </button>

            {/* Forward */}
            <button
              onClick={() => skipTime(15)}
              className="hover:text-primary-400 transition-colors flex items-center justify-center relative w-10 h-10 group/btn"
              title="Avançar 15s"
            >
              <RotateCw
                className="w-7 h-7 text-white group-hover/btn:text-primary-400 transition-colors"
                strokeWidth={1.5}
              />
              <span className="absolute text-[8px] font-bold mt-[1px] text-white group-hover/btn:text-primary-400 transition-colors">
                15
              </span>
            </button>

            {/* Tempo */}
            <span className="text-sm font-medium ml-2 border-l border-gray-600 pl-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Titulo (some em telas muito pequenas) */}
            <span className="hidden sm:inline-block text-sm font-medium ml-2 text-gray-300 truncate max-w-[200px] md:max-w-xs">
              {lessonTitle}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Playback rate (Settings / Dropdown) */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="hover:text-primary-400 transition-colors flex items-center justify-center h-full gap-1"
                title="Velocidade"
              >
                <span className="text-sm font-bold">{playbackRate}x</span>
              </button>

              {/* Dropdown Menu para velocidade */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-3 bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl overflow-hidden min-w-[120px] origin-bottom-right animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-2 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Velocidade
                  </div>
                  <div className="flex flex-col py-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                          playbackRate === rate
                            ? "text-primary-500 font-bold bg-gray-800/50"
                            : "text-gray-300"
                        }`}
                      >
                        {rate === 1 ? "Normal" : `${rate}x`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="hover:text-primary-400 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-primary-400 transition-colors mr-2"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
