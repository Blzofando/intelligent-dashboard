"use client";

import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react'; // Importa ícones limpos

export const ThemeToggle: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Efeito para checar o tema salvo no localStorage ou no sistema
    useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    }, []);

    // Efeito para aplicar o tema ao HTML
    useEffect(() => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, [isDarkMode]);

    const toggleTheme = () => {
      setIsDarkMode(!isDarkMode);
    };

    return (
      <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
      >
        {/* Mostra o ícone oposto ao tema atual */}
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
};