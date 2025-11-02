import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { courseData } from '@/data/courseData'; 
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { StudySettings, StudyPlanDay } from '@/types';

const lessonDurations: Record<string, number> = lessonDurationsJSON;

// Pega a API Key do arquivo .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const dayMap = {
    'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6
};
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
    try {
        const { settings, completedLessons } = await request.json() as { settings: StudySettings, completedLessons: string[] };

        // 1. Montar a lista de aulas que FALTAM
        const pendingLessons = [];
        for (const module of courseData.modules) {
            for (const lesson of module.lessons) {
                if (!completedLessons.includes(lesson.id)) {
                    pendingLessons.push({
                        id: lesson.id,
                        title: lesson.title,
                        module: module.title,
                        duration: (lessonDurations[lesson.id] || 300) // Pega a duração (em segundos)
                    });
                }
            }
        }
        
        if (pendingLessons.length === 0) {
             return NextResponse.json({ plan: [], expectedCompletionDate: formatDate(new Date()) });
        }
        
        // 2. Criar o Prompt Detalhado para a IA
        const prompt = `
          Você é um planejador de estudos especialista. Sua tarefa é criar um plano de estudos detalhado para um aluno de Power BI, dia a dia.

          **Restrições do Aluno:**
          1.  **Ritmo:** ${settings.mode} (aprox. ${settings.minutesPerDay} minutos por dia).
          2.  **Dias de Estudo:** ${settings.daysOfWeek.join(', ')}.
          3.  **Foco Opcional:** ${settings.focusArea || "Nenhum foco específico, seguir a ordem do curso."}
          
          **Aulas Pendentes (Total: ${pendingLessons.length}):**
          (Formato: ID da Aula, Módulo, Título, Duração em Segundos)
          ${pendingLessons.map(l => `${l.id}, ${l.module}, ${l.title}, ${l.duration}s`).join('\n')}

          **Sua Tarefa:**
          1.  Comece a planejar a partir de amanhã.
          2.  Distribua as aulas pendentes nos dias de estudo permitidos (${settings.daysOfWeek.join(', ')}).
          3.  Tente agrupar as aulas para que a soma da duração diária fique próxima de ${settings.minutesPerDay} minutos. É ACEITÁVEL ultrapassar um pouco (até 30%) se for para concluir um tópico.
          4.  Se houver um foco (ex: "licitação"), priorize módulos que contenham essa palavra-chave.
          5.  Mantenha a ordem cronológica das aulas o máximo possível.

          **Formato da Resposta (JSON Obrigatório):**
          Responda APENAS com um objeto JSON no seguinte formato:
          {
            "plan": [
              {
                "date": "YYYY-MM-DD", 
                "lessons": [
                  { "id": "F003", "title": "01. O que é BI", "duration": 592 },
                  { "id": "F004", "title": "02. Notebook ideal", "duration": 509 }
                ]
              }
            ],
            "expectedCompletionDate": "YYYY-MM-DD"
          }
        `;

        // 3. Chamar a IA (com o modelo PRO, como você pediu)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro", // <-- CORREÇÃO AQUI
            generationConfig, 
            safetySettings 
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const planData = JSON.parse(responseText);
        
        if (!planData.plan || !planData.expectedCompletionDate) {
            throw new Error("A IA retornou um formato de plano inválido.");
        }

        return NextResponse.json(planData);

    } catch (error) {
        console.error("Erro na API generate-plan:", error);
        return NextResponse.json({ error: 'Erro ao gerar o plano de estudos' }, { status: 500 });
    }
}