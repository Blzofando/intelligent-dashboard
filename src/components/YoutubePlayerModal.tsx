"use client";

import React from 'react';

interface YoutubePlayerModalProps {
  embedUrl: string;
  onClose: () => void;
}

const YoutubePlayerModal: React.FC<YoutubePlayerModalProps> = ({ embedUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose} // Clica fora para fechar
    >
      <div 
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do vídeo feche o modal
      >
        {/* Botão de Fechar */}
        <button 
          onClick={onClose} 
          className="absolute -top-10 right-0 text-white text-4xl hover:text-gray-300 transition-colors"
          aria-label="Fechar player de vídeo"
        >
          &times;
        </button>
        
        {/* Iframe do Player */}
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
          <iframe
            width="100%"
            height="100%"
            src={`${embedUrl}?autoplay=1&rel=0`} // Adiciona autoplay e remove vídeos relacionados
            title="Player de vídeo do YouTube"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default YoutubePlayerModal;