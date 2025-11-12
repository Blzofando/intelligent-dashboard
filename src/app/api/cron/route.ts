import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StudySettings, StudyPlan, UserProfile, StudyPlanDay } from '@/types'; 
import { courseData } from '@/data/courseData'; 
import lessonDurationsJSON from '@/data/lessonDurations.json';

// --- CONFIGURAÇÃO DO FIREBASE ADMIN ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);
// --- FIM DA CONFIGURAÇÃO ---

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const GEMINI_MODEL = "gemini-1.5-pro-latest"; 

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Define as datas
  const today = new Date();
  const todayString = formatDate(today); // O dia que ACABOU de começar
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = formatDate(yesterday); // O dia que ACABOU de terminar

  try {
    const usersSnapshot = await db.collection('users').get();
    let usersProcessed = 0;
    let streaksReset = 0;
    let plansReorganized = 0;

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data() as UserProfile;
      const userId = userDoc.id;

      if (!user.studyPlan || !user.studySettings) {
        continue; 
      }

      const plan = user.studyPlan;
      const settings = user.studySettings;
      let newStreak = user.studyStreak || 0;
      
      // --- 1. LÓGICA DE OFENSIVA (STREAK) ---
      // (Verifica o dia que acabou de terminar, 'yesterdayString')
      const lastUpdate = user.lastStreakUpdate || null;
      if (lastUpdate !== todayString && lastUpdate !== yesterdayString) {
        if (newStreak > 0) {
          newStreak = 0; 
          streaksReset++;
        }
      }
      
      // --- 2. LÓGICA DE REORGANIZAÇÃO (Aulas Atrasadas OU Adiantadas) ---
      let needsReorg = false;
      let reorgReason = "N/A";

      // VERIFICAÇÃO 1: Está ATRASADO?
      // (Alguma aula ANTES de HOJE está incompleta?)
      const missedLessons = plan.plan.some(day =>
        day.date < todayString &&
        day.lessons.some(lesson => !user.completedLessons.includes(lesson.id))
      );

      if (missedLessons) {
        needsReorg = true;
        reorgReason = "Aulas atrasadas";
      } else {
        // VERIFICAÇÃO 2: Está ADIANTADO?
        // (Se não está atrasado, vamos ver se ele já fez > 60% do dia de HOJE)
        const dayToday = plan.plan.find(day => day.date === todayString);
        
        if (dayToday && dayToday.lessons.length > 0) {
          const completedTodayCount = dayToday.lessons.filter(lesson => 
            user.completedLessons.includes(lesson.id)
          ).length;
          
          const percentComplete = (completedTodayCount / dayToday.lessons.length) * 100;

          // Se completou mais de 60% do dia seguinte (hoje), reformula
          if (percentComplete > 60) {
            needsReorg = true;
            reorgReason = `Usuário adiantado (${percentComplete.toFixed(0)}% completo)`;
          }
        }
      }

      // 3. Executa a reorganização (se necessário)
      let newPlan = plan;
      if (needsReorg) {
        console.log(`Reorganizando plano para ${userId} (Motivo: ${reorgReason})...`);
        newPlan = await reorganizePlanWithAI(user, settings);
        plansReorganized++;
      }
      // --- FIM DA LÓGICA DE REORGANIZAÇÃO ---

      // 4. Salva as atualizações no Firebase
      await db.collection('users').doc(userId).update({
        studyStreak: newStreak,
        studyPlan: newPlan
      });
      usersProcessed++;
    }

    return NextResponse.json({ 
      message: "Cron Job executado com sucesso.",
      usersProcessed,
      streaksReset,
      plansReorganized
    });

  } catch (error: any) {
    console.error("Erro no Cron Job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// --- LÓGICA DA IA (REORGANIZAÇÃO) ---
// (Esta parte não muda, é a mesma função que gera o plano)
const lessonDurations: Record<string, number> = lessonDurationsJSON;
type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };
type PartialLessonFromAI = { id: string; title: string; };
type PlanFromIA = { 
  plan: { date: string; lessons: PartialLessonFromAI[]; }[], 
  expectedCompletionDate: string 
};

async function reorganizePlanWithAI(profile: UserProfile, settings: StudySettings): Promise<StudyPlan> {
  const { completedLessons } = profile;
  const allPendingLessons: { id: string, title: string, duration: number }[] = []; 
  
  for (const module of courseData.modules) {
    for (const lesson of module.lessons) {
      if (!completedLessons.includes(lesson.id)) {
        allPendingLessons.push({ 
          id: lesson.id, 
          title: lesson.title,
          duration: lessonDurations[lesson.id] || 300 
        });
      }
    }
  }

  if (allPendingLessons.length === 0) {
    return { plan: [], expectedCompletionDate: formatDate(new Date()) };
  }

  const allowedDaysNum = new Set(settings.daysOfWeek.map(d => allDaysMap[d]));
  const forbiddenDaysStr = (Object.keys(allDaysMap) as DayKey[])
    .filter(day => !allowedDaysNum.has(allDaysMap[day]))
    .join(', ') || "Nenhum";
  
  const startDate = formatDate(new Date()); // Reorganiza a partir de HOJE

  const prompt = `
    REORGANIZAÇÃO DE PLANO.
    O plano anterior do aluno está desatualizado. Crie um novo plano.
    Responda APENAS com o objeto JSON.
    Meta Diária: ${settings.minutesPerDay} minutos (${settings.minutesPerDay * 60} segundos).
    Dias de Estudo: ${settings.daysOfWeek.join(', ')}.
    Dias de Folga: ${forbiddenDaysStr}.
    Data de Início (Hoje): ${startDate}.
    Mantenha a ordem cronológica.

    Formato: { "plan": [...], "expectedCompletionDate": "YYYY-MM-DD" }

    Aulas Pendentes (id, title, duration_in_seconds):
    ${JSON.stringify(allPendingLessons)} 
  `;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, generationConfig: { responseMimeType: "application/json" } });
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const planData = JSON.parse(responseText) as PlanFromIA;

  const planWithDurations: StudyPlanDay[] = planData.plan.map((day) => ({
    ...day,
    lessons: day.lessons.map((lesson) => ({
      ...lesson,
      duration: lessonDurations[lesson.id] || 300
    }))
  }));

  return { ...planData, plan: planWithDurations };
}