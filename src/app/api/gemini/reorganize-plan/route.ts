import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { StudySettings, StudyPlanDay, UserProfile } from '@/types';
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { courseData } from '@/data/courseData'; 

const lessonDurations: Record<string, number> = lessonDurationsJSON;

// Pega a API Key do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// --- CORREÇÃO AQUI ---
type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
// --- FIM DA CORREÇÃO ---

export async function POST(request: NextRequest) {
    try {
        const { profile } = await request.json() as { profile: UserProfile };
        
        const { studyPlan, studySettings, completedLessons } = profile;
        if (!studyPlan || !studySettings) {
            return NextResponse.json({ error: 'Plano ou configurações não encontrados.' }, { status: 400 });
        }

        const today = formatDate(new Date());

        // 1. Encontrar aulas pendentes (atrasadas + futuras)
        const pendingLessons: any[] = [];
        // --- CORREÇÃO: Usando a lógica de resumo de MÓDULO ---
        const pendingModulesSummary: string[] = [];
        let totalPendingLessons = 0;
        const allPendingLessons: any[] = []; 

        for (const module of courseData.modules) {
            let pendingLessonCount = 0;
            let pendingDurationSeconds = 0;
            
            for (const lesson of module.lessons) {
                if (!completedLessons.includes(lesson.id)) {
                    const duration = lessonDurations[lesson.id] || 300;
                    allPendingLessons.push({ id: lesson.id, title: lesson.title, duration });
                    pendingLessonCount++;
                    pendingDurationSeconds += duration;
                }
            }
            
            if (pendingLessonCount > 0) {
                totalPendingLessons += pendingLessonCount;
                pendingModulesSummary.push(
                    `- Módulo "${module.title}": ${pendingLessonCount} aulas restantes, ${Math.round(pendingDurationSeconds / 60)} minutos no total.`
                );
            }
        }
        
        if (totalPendingLessons === 0) {
             return NextResponse.json({ plan: [], expectedCompletionDate: today });
        }
        // --- FIM DA LÓGICA DE RESUMO ---
        
        
        const allowedDaysNum = new Set(studySettings.daysOfWeek.map(d => allDaysMap[d]));
        const forbiddenDaysStr = (Object.keys(allDaysMap) as DayKey[])
            .filter(day => !allowedDaysNum.has(allDaysMap[day]))
            .join(', ') || "Nenhum";

        const prompt = `
          Você é um planejador de estudos especialista. A tarefa é **reorganizar** um plano de estudos existente para um aluno que perdeu alguns dias.

          **Data de Hoje:** ${today}

          **REGRAS OBRIGATÓRIAS (NÃO PODE QUEBRAR):**
          1.  **DIAS PERMITIDOS:** Você SÓ PODE agendar aulas nos seguintes dias da semana: ${studySettings.daysOfWeek.join(', ')}.
          2.  **DIAS PROIBIDOS:** NÃO agende NENHUMA aula nos seguintes dias: ${forbiddenDaysStr}.
          3.  **REGRA DE TEMPO:** A meta diária é de ${studySettings.minutesPerDay} minutos. Você DEVE preencher esse tempo. NÃO crie dias com menos de ${studySettings.minutesPerDay / 2} minutos. É OBRIGATÓRIO que a soma das durações das aulas do dia seja próxima de ${studySettings.minutesPerDay} minutos.
          4.  **ORDEM:** Mantenha a ordem cronológica dos módulos e aulas.
          5.  **FOCO (Opcional):** ${studySettings.focusArea || "Nenhum foco específico."}
          
          **Módulos Pendentes (Total: ${totalPendingLessons} aulas):**
          ${pendingModulesSummary.join('\n')}

          **Sua Tarefa:**
          1.  Crie um plano **totalmente novo** começando a partir de **hoje** (${today}) ou do próximo dia de estudo válido.
          2.  Distribua TODAS as aulas pendentes, seguindo TODAS as regras.
          
          **Aulas Pendentes (para você usar no JSON de resposta):**
          (Formato: ID, Título, Duração em Segundos)
          ${allPendingLessons.map(l => `${l.id}, ${l.title}, ${l.duration}s`).join('\n')}

          **Formato da Resposta (JSON Obrigatório):**
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

        // 3. Chamar a IA (Gemini 2.5 Pro)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro", 
            generationConfig, 
            safetySettings 
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const planData = JSON.parse(responseText);
        
        if (!planData.plan || !planData.expectedCompletionDate) {
            throw new Error("A IA (Gemini) retornou um formato de plano inválido.");
        }

        return NextResponse.json(planData);

    } catch (error) {
        console.error("Erro na API reorganize-plan (Gemini):", error);
        return NextResponse.json({ error: 'Erro ao reorganizar o plano' }, { status: 500 });
    }
}