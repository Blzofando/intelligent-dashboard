// src/lib/ai/prompts/types.ts

/**
 * Interface para prompts específicos de cada curso
 * Cada curso deve implementar todos esses prompts
 */
export interface CoursePrompts {
    /**
     * Gera prompt para criação de flashcards
     */
    flashcards: (moduleTitle: string, lessonTitles: string[]) => string;

    /**
     * Gera prompt para criação de resumo
     */
    summary: (moduleTitle: string, lessonTitles: string[]) => string;

    /**
     * Gera prompt para filtrar vídeos do YouTube com IA
     */
    youtubeFilter: (query: string, focus: string) => string;

    /**
     * Gera queries de busca do YouTube
     * @returns Array com [topicQuery, focusQuery?]
     */
    youtubeQuery: (moduleTitle: string, focusArea?: string) => string[];

    /**
     * Gera prompt para criação de quiz
     */
    quiz: (moduleTitle: string, lessonTitles: string[]) => string;

    /**
     * Gera prompt para chat/assistente
     */
    chat: (context: string, userMessage: string) => string;
}

/**
 * Metadados do curso
 */
export interface CourseMetadata {
    id: string;
    name: string;
    prompts: CoursePrompts;
}
