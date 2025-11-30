// src/lib/ai/prompts/power-bi.ts
import { CoursePrompts } from './types';

/**
 * Todos os prompts específicos do Power BI
 * Centralizados em um único arquivo para fácil manutenção
 */
export const powerBiPrompts: CoursePrompts = {
    flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 5 flashcards para o módulo de Power BI "${moduleTitle}", 
    baseado nos tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir exatamente esta estrutura:
    [
        {
            "front": "Termo ou pergunta curta (ex: O que é DAX?)",
            "back": "Definição ou resposta clara e concisa."
        },
        {
            "front": "Termo 2",
            "back": "Resposta 2"
        }
    ]
    
    Gere 5 flashcards focados em conceitos práticos de Power BI.
  `,

    summary: (moduleTitle: string, lessonTitles: string[]) => `
    Gere um resumo conciso para o módulo do curso de Power BI "${moduleTitle}", 
    que aborda os seguintes tópicos: ${lessonTitles.join(", ")}. 
    
    O resumo deve:
    - Ter no máximo 100 palavras
    - Focar nos conceitos chave de Power BI
    - Ser prático e direto
    - Mencionar aplicações reais
  `,

    youtubeFilter: (query: string, focus: string) => `
    Você é um curador de conteúdo sênior especializado em Power BI.
    O aluno está estudando Power BI e tem o seguinte foco de carreira: "${focus}"
    Ele está buscando vídeos sobre este tópico: "${query}"

    Eu busquei 20 vídeos no YouTube. Analise esta lista (títulos e descrições) e selecione os 10 MELHORES e MAIS RELEVANTES.
    
    Critérios de seleção:
    - Priorize tutoriais práticos de Power BI
    - Conecte o tópico ao foco de carreira do aluno
    - Evite vídeos muito genéricos ou clickbait
    - Prefira vídeos de criadores reconhecidos na comunidade Power BI
    - Considere a aplicabilidade prática do conteúdo
    
    Responda APENAS com um array JSON dos 10 vídeos selecionados, no formato original.
    Exemplo: [{"id": {"videoId": "..."}, "snippet": {"title": "...", "description": "..."}}, ...]
  `,

    youtubeQuery: (moduleTitle: string, focusArea?: string) => {
        const topicQuery = `tutorial Power BI "${moduleTitle}"`;

        if (focusArea && focusArea !== "Sem foco definido") {
            const focusQuery = `Power BI "${moduleTitle}" aplicado a "${focusArea}"`;
            return [topicQuery, focusQuery];
        }

        return [topicQuery];
    },

    quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Crie um quiz com 3 perguntas de múltipla escolha sobre o módulo de Power BI "${moduleTitle}", 
    com base nos tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir exatamente esta estrutura:
    [
        {
            "question": "Texto da pergunta 1?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": "Opção B"
        },
        {
            "question": "Texto da pergunta 2?",
            "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
            "correctAnswer": "Opção 3"
        }
    ]
    
    Requisitos:
    - Gere 3 perguntas de nível intermediário
    - As opções e a resposta correta devem ser de texto simples
    - A resposta correta (correctAnswer) deve ser EXATAMENTE igual a um dos textos das 'options'
    - Foque em conceitos práticos de Power BI
    - Evite perguntas muito teóricas ou decorebas
  `,

    chat: (context: string, userMessage: string) => `
    Você é um assistente especializado em Power BI, ajudando um aluno a estudar.
    
    Contexto atual do aluno:
    ${context}
    
    Mensagem do aluno:
    ${userMessage}
    
    Responda de forma:
    - Clara e didática
    - Focada em aplicações práticas de Power BI
    - Com exemplos quando relevante
    - Incentivando o aprendizado contínuo
  `,
};
