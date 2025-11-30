import { QuizQuestion, Flashcard, StudyPlan, YouTubeVideo } from "@/types"; // Importa YouTubeVideo

// Função para formatar data como "YYYY-MM-DD"
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}



// --- NOVA FUNÇÃO: Recomendações do YouTube (Carrossel) ---
export const getYoutubeRecommendations = async (focusArea: string, nextTopic: string): Promise<YouTubeVideo[]> => {
  try {
    const response = await fetch('/api/gemini/youtube-recs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ focusArea, nextTopic }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de recomendações do YouTube');
    }

    const data: YouTubeVideo[] = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de recomendações do YouTube:", error);
    return [];
  }
};


// Versão "Falsa" (dummy) que retorna os tipos corretos
const dummyPromise = <T,>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), 500));


// --- API do Resumo ---
export const generateSummary = async (moduleTitle: string, lessonTitles: string[], courseId?: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleTitle, lessonTitles, courseId }),
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

// --- API do Quiz ---
export const generateQuiz = async (moduleTitle: string, lessonTitles: string[], courseId?: string): Promise<QuizQuestion[]> => {
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

    const data: QuizQuestion[] = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de quiz:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

// --- API dos Flashcards ---
export const generateFlashcards = async (moduleTitle: string, lessonTitles: string[], courseId?: string): Promise<Flashcard[]> => {
  try {
    const response = await fetch('/api/gemini/flashcards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleTitle, lessonTitles, courseId }),
    });

    if (!response.ok) {
      throw new Error('Erro na resposta da API de flashcards');
    }

    const data: Flashcard[] = await response.json();
    return data;

  } catch (error) {
    console.error("Erro ao chamar a API de flashcards:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

// --- API do Plano de Estudos (Gemini) ---
export const generateStudyPlan = async (settings: any, completedLessons: string[]): Promise<StudyPlan> => {
  try {
    const response = await fetch('/api/gemini/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings,
        completedLessons,
      }),
    });

    if (!response.ok) {
      throw new Error("Falha ao gerar o plano (Gemini).");
    }

    const plan: StudyPlan = await response.json();
    return plan;

  } catch (error) {
    console.error("Erro ao chamar a API de plano de estudos:", error);
    // --- A CORREÇÃO ESTÁ AQUI ---
    // Retorna um objeto StudyPlan completo (com 'plan' e 'expectedCompletionDate')
    return { plan: [], expectedCompletionDate: formatDate(new Date()) };
  }
};

// --- API do Chat ---
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

    const data: { answer: string } = await response.json();

    return data.answer || "Não obtive uma resposta.";

  } catch (error) {
    console.error("Erro ao chamar a API de chat:", error);
    return "Desculpe, não consegui processar sua pergunta. Tente novamente.";
  }
};

// --- API das Recomendações ---
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

    const data: { recommendations: string } = await response.json();
    return data.recommendations || "Não foi possível gerar recomendações.";

  } catch (error) {
    console.error("Erro ao chamar a API de recomendações:", error);
    return "Desculpe, não consegui gerar as recomendações. Tente novamente.";
  }
};

export async function generatePbixChallenge(moduleTitle: string, lessonTitles: string[]) {
  const response = await fetch("/api/gemini/pbix-challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moduleTitle, lessonTitles }),
  });

  if (!response.ok) throw new Error("Erro ao chamar /pbix-challenge");

  return await response.json();
}