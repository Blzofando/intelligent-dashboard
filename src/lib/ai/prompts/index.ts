// src/lib/ai/prompts/index.ts
import { powerBiPrompts } from './power-bi';
import { licitacaoPrompts } from './licitacao';
import { CoursePrompts } from './types';

/**
 * Mapa de prompts por ID do curso
 * Facilita a busca dinâmica baseada no courseId
 */
export const coursePromptsMap: Record<string, CoursePrompts> = {
    'power-bi': powerBiPrompts,
    'lic': licitacaoPrompts,
    'licitacao': licitacaoPrompts,
};

/**
 * Retorna os prompts para um curso específico
 * @param courseId - ID do curso (ex: 'power-bi', 'lic', 'licitacao')
 * @returns Prompts do curso ou prompts do Power BI como fallback
 */
export function getCoursePrompts(courseId: string): CoursePrompts {
    const prompts = coursePromptsMap[courseId];

    if (!prompts) {
        console.warn(`⚠️ Prompts não encontrados para curso "${courseId}". Usando Power BI como fallback.`);
        return powerBiPrompts;
    }

    return prompts;
}

// Exportar os prompts individuais para uso direto se necessário
export { powerBiPrompts } from './power-bi';
export { licitacaoPrompts } from './licitacao';
export type { CoursePrompts, CourseMetadata } from './types';
