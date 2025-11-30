// src/lib/ai/prompts/licitacao.ts
import { CoursePrompts } from './types';

/**
 * Todos os prompts específicos do curso de Licitação
 * Centralizados em um único arquivo para fácil manutenção
 */
export const licitacaoPrompts: CoursePrompts = {
    flashcards: (moduleTitle: string, lessonTitles: string[]) => `
    Crie 5 flashcards para o módulo de Licitação "${moduleTitle}", 
    baseado nos tópicos: ${lessonTitles.join(", ")}.
    
    Seu JSON deve seguir exatamente esta estrutura:
    [
        {
            "front": "Termo ou pergunta curta sobre licitações",
            "back": "Definição clara e objetiva com base na legislação"
        }
    ]
    
    Gere 5 flashcards focados em conceitos práticos de licitações públicas.
    Priorize:
    - Termos técnicos da Lei 14.133/2021
    - Modalidades de licitação
    - Procedimentos práticos
    - Prazos e documentação
  `,

    summary: (moduleTitle: string, lessonTitles: string[]) => `
    Gere um resumo conciso para o módulo do curso de Licitação "${moduleTitle}", 
    que aborda os seguintes tópicos: ${lessonTitles.join(", ")}.
    
    O resumo deve:
    - Ter no máximo 100 palavras
    - Focar em aspectos práticos da Lei 14.133/2021
    - Ser objetivo e direto
    - Mencionar aplicações no dia a dia de licitantes
  `,

    youtubeFilter: (query: string, focus: string) => `
    Você é um curador de conteúdo sênior especializado em Licitações Públicas.
    O aluno está estudando Licitações e tem o seguinte foco: "${focus}"
    Ele está buscando vídeos sobre: "${query}"

    Analise os 20 vídeos encontrados e selecione os 10 MELHORES e MAIS RELEVANTES.
    
    Critérios de seleção:
    - Priorize conteúdo atualizado (Lei 14.133/2021)
    - Foque em aplicações práticas para licitantes
    - Evite conteúdo muito teórico ou acadêmico
    - Prefira vídeos de profissionais da área
    - Considere a clareza e didática do conteúdo
    
    Responda APENAS com um array JSON dos 10 vídeos selecionados, no formato original.
  `,

    youtubeQuery: (moduleTitle: string, focusArea?: string) => {
        const topicQuery = `tutorial licitação "${moduleTitle}" Lei 14.133`;

        if (focusArea && focusArea !== "Sem foco definido") {
            const focusQuery = `licitação "${moduleTitle}" ${focusArea}`;
            return [topicQuery, focusQuery];
        }

        return [topicQuery];
    },

    quiz: (moduleTitle: string, lessonTitles: string[]) => `
    Crie um quiz com 3 perguntas de múltipla escolha sobre Licitações no módulo "${moduleTitle}", 
    com base nos tópicos: ${lessonTitles.join(", ")}.
    
    Formato JSON:
    [
        {
            "question": "Pergunta sobre licitação?",
            "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "correctAnswer": "Opção correta (deve ser igual a uma das options)"
        }
    ]
    
    Requisitos:
    - 3 perguntas práticas sobre licitações
    - Baseadas na Lei 14.133/2021
    - Foque em situações reais que licitantes enfrentam
    - Evite pegadinhas ou questões muito decorebas
  `,

    chat: (context: string, userMessage: string) => `
    Você é um assistente especializado em Licitações Públicas (Lei 14.133/2021).
    
    Contexto do aluno:
    ${context}
    
    Pergunta:
    ${userMessage}
    
    Responda de forma:
    - Clara e prática
    - Baseada na legislação atual
    - Com exemplos do dia a dia de licitantes
    - Incentivando boas práticas
  `,
};
