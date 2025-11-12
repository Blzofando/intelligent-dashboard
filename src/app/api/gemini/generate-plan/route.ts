import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { courseData } from '@/data/courseData'; 
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { StudySettings, StudyPlanDay } from '@/types'; 

const lessonDurations: Record<string, number> = lessonDurationsJSON;

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

type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };

// Tipos de resposta da IA
type PartialLessonFromAI = { id: string; title: string; };
type PlanFromIA = { 
  plan: { 
    date: string; 
    lessons: PartialLessonFromAI[];
  }[], 
  expectedCompletionDate: string 
};

export async function POST(request: NextRequest) {
    try {
        const { settings, completedLessons } = await request.json() as { settings: StudySettings, completedLessons: string[] };

        // --- MUDANÇA: Criar a lista de aulas com duração ---
        const allPendingLessons: { id: string, title: string, duration: number }[] = []; 

        for (const module of courseData.modules) {
            for (const lesson of module.lessons) {
                if (!completedLessons.includes(lesson.id)) {
                    allPendingLessons.push({ 
                        id: lesson.id, 
                        title: lesson.title,
                        // Adiciona a duração em SEGUNDOS, como você pediu
                        duration: lessonDurations[lesson.id] || 300 
                    });
                }
            }
        }
        
        if (allPendingLessons.length === 0) {
            return NextResponse.json({ plan: [], expectedCompletionDate: formatDate(new Date()) });
        }
        
        const today = formatDate(new Date()); 
        const allowedDaysNum = new Set(settings.daysOfWeek.map(d => allDaysMap[d]));
        const forbiddenDaysStr = (Object.keys(allDaysMap) as DayKey[])
            .filter(day => !allowedDaysNum.has(allDaysMap[day]))
            .join(', ') || "Nenhum";

        // --- MUDANÇA: O Prompt conciso que você pediu ---
        const prompt = `
          Você é um planejador de estudos especialista. Sua tarefa é criar um plano de estudos detalhado para um aluno de Power BI, dia a dia.
          Responda APENAS com um objeto JSON no formato especificado.
          O JSON deve conter **todo** o plano, não apenas uma parte.

          **Formato da Resposta (JSON Obrigatório):**
          {
            "plan": [
              {
                "date": "YYYY-MM-DD", 
                "lessons": [
                  { "id": "F003", "title": "01. O que é BI" },
                  { "id": "F004", "title": "02. Notebook ideal" }
                ]
              }
            ],
            "expectedCompletionDate": "YYYY-MM-DD" // A data da última aula do plano
          }
        
          Regras:
          1.  **Meta Diária:** ${settings.minutesPerDay} minutos. Agrupe aulas (usando a 'duration' fornecida) até atingir *aproximadamente* este tempo (${settings.minutesPerDay * 60} segundos). Pode variar um pouco.
          2.  **Dias de Estudo:** Agende aulas APENAS nos dias: ${settings.daysOfWeek.join(', ')}.
          3.  **Dias de Folga:** NÃO agende aulas nos dias: ${forbiddenDaysStr}.
          4.  **Data de Início:** Comece em ${settings.startDate}.
          5.  **Ordem:** Mantenha a ordem cronológica da lista de aulas pendentes.

          Lista de Aulas Pendentes (id, title, duration_in_seconds):
          ${JSON.stringify(allPendingLessons)} 
          
          Crie o plano.
        `;
        // --- FIM DA MUDANÇA ---
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro", // Usando o modelo que você confirmou
            generationConfig, 
            safetySettings 
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const planData = JSON.parse(responseText) as PlanFromIA;
        
        // Adiciona durações ao plano (a IA só retorna id/title)
        const planWithDurations: StudyPlanDay[] = planData.plan.map((day) => ({
            ...day,
            lessons: day.lessons.map((lesson) => ({
                ...lesson,
                duration: lessonDurations[lesson.id] || 300
            }))
        }));

        const finalData = { ...planData, plan: planWithDurations };

        return NextResponse.json(finalData);

    } catch (error) {
        console.error("Erro na API generate-plan (Gemini):", error);
        return NextResponse.json({ error: 'Erro ao gerar o plano de estudos' }, { status: 500 });
    }
}
