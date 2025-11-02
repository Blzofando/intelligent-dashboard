// src/services/geminiService.ts

import { QuizQuestion, Flashcard, StudyPlan } from "@/types";

// --- 1. CORREÇÃO AQUI ---
// Corrigimos a função "falsa" para usar "Generics" (<T>)
// Isso diz ao TypeScript qual o tipo de retorno que esperamos.
const dummyPromise = <T,>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 500));

// Agora usamos <T> para dizer ao TypeScript qual o tipo de retorno
export const generateSummary = async (moduleTitle: string, lessonTitles: string[]): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleTitle, lessonTitles }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de resumo');
    }

    const data: { summary: string } = await response.json();
    return data.summary || "Não foi possível gerar o resumo.";

  } catch (error) {
    console.error("Erro ao chamar a API de resumo:", error);
    return "Desculpe, não consegui gerar o resumo. Tente novamente.";
  }
};

export const generateQuiz = async (moduleTitle: string, lessonTitles: string[]): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch('/api/gemini/quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleTitle, lessonTitles }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de quiz');
    }

    // A resposta da API já é o array de perguntas
    const data: QuizQuestion[] = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de quiz:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

export const generateFlashcards = async (moduleTitle: string, lessonTitles: string[]): Promise<Flashcard[]> => {
  try {
    const response = await fetch('/api/gemini/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleTitle, lessonTitles }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de flashcards');
    }

    // A resposta da API já é o array de flashcards
    const data: Flashcard[] = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de flashcards:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

export const generateStudyPlan = async (courseContent: { title: string; lessons: number }[], goalDays: number, hoursPerDay: number): Promise<StudyPlan> => {
  try {
    const response = await fetch('/api/gemini/study-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseContent, goalDays, hoursPerDay }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de plano de estudos');
    }

    // A resposta da API já é o objeto { plan: [...] }
    const data: StudyPlan = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de plano de estudos:", error);
    return { plan: [] }; // Retorna um plano vazio em caso de erro
  }
};

// --- 2. CORREÇÃO AQUI ---
// Corrigimos a função de chat para tipar a resposta do JSON
export const answerCourseQuestion = async (question: string, context: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API');
    }

    // Dizemos ao TypeScript que esperamos um objeto com a chave 'answer'
    const data: { answer: string } = await response.json(); 
    
    return data.answer || "Não obtive uma resposta.";

  } catch (error) {
    console.error("Erro ao chamar a API de chat:", error);
    return "Desculpe, não consegui processar sua pergunta. Tente novamente.";
  }
};

export const getRecommendations = async (completedModules: string[]): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ completedModules }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de recomendações');
    }

    // A resposta da API é um objeto { recommendations: "texto..." }
    const data: { recommendations: string } = await response.json();
    return data.recommendations || "Não foi possível gerar recomendações.";

  } catch (error) {
    console.error("Erro ao chamar a API de recomendações:", error);
    return "Desculpe, não consegui gerar as recomendações. Tente novamente.";
  }
};