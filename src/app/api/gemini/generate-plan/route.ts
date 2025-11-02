import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { courseData } from '@/data/courseData'; 
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { StudySettings, StudyPlanDay } from '@/types'; // Importei StudyPlanDay

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

// --- 1. CORREÇÃO DE TIPO ---
// Tipo parcial que a IA retorna (sem duration)
type PartialLessonFromAI = { id: string; title: string; };
// O 'plan' é um array de dias
type PlanFromIA = { 
  plan: { 
    date: string; 
    lessons: PartialLessonFromAI[];
  }[], 
  expectedCompletionDate: string 
};
// --- FIM DA CORREÇÃO ---

export async function POST(request: NextRequest) {
    try {
        const { settings, completedLessons } = await request.json() as { settings: StudySettings, completedLessons: string[] };

        // --- LÓGICA DE RESUMO (Corrigida) ---
        const pendingModulesSummary: string[] = [];
        let totalPendingLessons = 0;
        const allPendingLessons: { id: string, title: string }[] = []; 

        for (const module of courseData.modules) {
            let pendingLessonCount = 0;
            let pendingDurationSeconds = 0;
            
            for (const lesson of module.lessons) {
                if (!completedLessons.includes(lesson.id)) {
                    allPendingLessons.push({ id: lesson.id, title: lesson.title }); 
                    pendingLessonCount++;
                    pendingDurationSeconds += (lessonDurations[lesson.id] || 300); 
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
             return NextResponse.json({ plan: [], expectedCompletionDate: formatDate(new Date()) });
        }
        
        const today = formatDate(new Date()); 
        
        const allowedDaysNum = new Set(settings.daysOfWeek.map(d => allDaysMap[d]));
        const forbiddenDaysStr = (Object.keys(allDaysMap) as DayKey[])
            .filter(day => !allowedDaysNum.has(allDaysMap[day]))
            .join(', ') || "Nenhum";

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
        
          **Contexto:**
          - Data de Hoje: ${today}
          - Data de Início Solicitada: ${settings.startDate}

          **REGRAS OBRIGATÓRIAS:**
          1.  **DIAS PERMITIDOS:** Você SÓ PODE agendar aulas nos dias: ${settings.daysOfWeek.join(', ')}.
          2.  **DIAS PROIBIDOS:** NÃO agende NENHUMA aula nos dias: ${forbiddenDaysStr}.
          3.  **REGRA DE TEMPO:** A meta diária é ${settings.minutesPerDay} minutos. Você DEVE preencher esse tempo. NÃO crie dias com menos de ${settings.minutesPerDay / 1.6} minutos.
          4.  **ORDEM:** Mantenha a ordem cronológica das aulas.
          
          **Módulos Pendentes (Total: ${totalPendingLessons} aulas):**
          ${pendingModulesSummary.join('\n')} 

          **Aulas Pendentes (para você usar no JSON de resposta):**
          (Formato: ID, Título)
          ${allPendingLessons.map(l => `${l.id}, ${l.title}`).join('\n')}

          **Sua Tarefa:**
          Crie o plano de estudos em JSON começando da ${settings.startDate}, seguindo TODAS as regras.
        `;

        // 3. Chamar a IA (Gemini 2.5 Pro)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-pro", 
            generationConfig, 
            safetySettings 
        });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // 2. CORREÇÃO: Tipa o 'planData' com o tipo que definimos
        const planData = JSON.parse(responseText) as PlanFromIA;
        
        // 3. CORREÇÃO: Tipa 'day' e 'lesson'
        // Adiciona durações ao plano
        const planWithDurations: StudyPlanDay[] = planData.plan.map((day: { date: string, lessons: PartialLessonFromAI[] }) => ({
            ...day,
            lessons: day.lessons.map((lesson: PartialLessonFromAI) => ({
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

