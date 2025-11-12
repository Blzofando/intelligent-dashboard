import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { StudySettings, StudyPlan, UserProfile, StudyPlanDay, Lesson } from '@/types'; 
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

// --- 1. A LÓGICA DA "CALCULADORA" RÁPIDA ---
const lessonDurations: Record<string, number> = lessonDurationsJSON;
const RHYTHM_TARGETS_SECONDS = {
  suave: 30 * 60,
  regular: 60 * 60,
  intensivo: 90 * 60,
};
type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// (Funções 'createMasterPlan' e 'applyUserSchedule' - Sem alterações)
function createMasterPlan(
  completedLessons: Set<string>, 
  targetDuration: number
): StudyPlanDay[] {
  const masterPlan: StudyPlanDay[] = [];
  let currentDayLessons: { id: string; title: string; duration: number }[] = [];
  let currentDayDuration = 0;
  for (const module of courseData.modules) {
    for (const lesson of module.lessons) {
      if (completedLessons.has(lesson.id)) {
        continue;
      }
      const duration = lessonDurations[lesson.id] || 300; 
      currentDayLessons.push({ ...lesson, duration });
      currentDayDuration += duration;
      if (currentDayDuration >= targetDuration) {
        masterPlan.push({ date: "TBD", lessons: currentDayLessons });
        currentDayLessons = [];
        currentDayDuration = 0;
      }
    }
  }
  if (currentDayLessons.length > 0) {
    masterPlan.push({ date: "TBD", lessons: currentDayLessons });
  }
  return masterPlan;
}
function applyUserSchedule(
  masterPlan: StudyPlanDay[], 
  settings: StudySettings
): StudyPlanDay[] {
  const finalPlan: StudyPlanDay[] = [];
  const allowedDays = new Set(settings.daysOfWeek.map(d => allDaysMap[d]));
  let currentDate = new Date(formatDate(new Date()) + 'T12:00:00Z'); 
  for (const masterDay of masterPlan) {
    while (!allowedDays.has(currentDate.getUTCDay())) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    finalPlan.push({
      date: formatDate(currentDate),
      lessons: masterDay.lessons
    });
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
  return finalPlan;
}

// Função que a "Calculadora" usa
async function generateNewPlanFast(profile: UserProfile, settings: StudySettings): Promise<StudyPlan> {
  const completedLessonSet = new Set(profile.completedLessons);
  
  // --- 2. A CORREÇÃO ESTÁ AQUI TAMBÉM ---
  const targetDurationInSeconds = settings.mode === 'personalizado'
    ? (settings.minutesPerDay || 60) * 60
    : (RHYTHM_TARGETS_SECONDS[settings.mode] || 3600);
  // --- FIM DA CORREÇÃO ---

  const masterPlan = createMasterPlan(completedLessonSet, targetDurationInSeconds);
  const finalPlan = applyUserSchedule(masterPlan, settings);

  const expectedCompletionDate = finalPlan.length > 0 
    ? finalPlan[finalPlan.length - 1].date 
    : formatDate(new Date());

  return {
    plan: finalPlan,
    expectedCompletionDate: expectedCompletionDate
  };
}
// --- FIM DA LÓGICA DA "CALCULADORA" ---


// --- A API DO CRON JOB ---
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const today = new Date();
  const todayString = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = formatDate(yesterday);

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
      
      // 1. Lógica da Ofensiva (Streak)
      const lastUpdate = user.lastStreakUpdate || null;
      if (lastUpdate !== todayString && lastUpdate !== yesterdayString) {
        if (newStreak > 0) {
          newStreak = 0; 
          streaksReset++;
        }
      }
      
      // 2. Lógica de Reorganização
      let needsReorg = false;

      // Verificação 1: Está ATRASADO?
      const missedLessons = plan.plan.some(day =>
        day.date < todayString &&
        !day.lessons.every(lesson => user.completedLessons.includes(lesson.id))
      );

      if (missedLessons) {
        needsReorg = true;
      } else {
        // Verificação 2: Está ADIANTADO?
        const dayToday = plan.plan.find(day => day.date === todayString);
        if (dayToday && dayToday.lessons.length > 0) {
          const completedTodayCount = dayToday.lessons.filter(lesson => 
            user.completedLessons.includes(lesson.id)
          ).length;
          const percentComplete = (completedTodayCount / dayToday.lessons.length) * 100;
          if (percentComplete >= 50) { // Regra de 50%
            needsReorg = true;
          }
        }
      }

      // 3. Executa a reorganização
      let newPlan = plan;
      if (needsReorg) {
        console.log(`Reorganizando plano (rápido) para ${userId}...`);
        newPlan = await generateNewPlanFast(user, settings);
        plansReorganized++;
      }

      // 4. Salva as atualizações no Firebase
      await db.collection('users').doc(userId).update({
        studyStreak: newStreak,
        studyPlan: newPlan
      });
      usersProcessed++;
    }

    return NextResponse.json({ 
      message: "Cron Job (Rápido) executado com sucesso.",
      usersProcessed,
      streaksReset,
      plansReorganized
    });

  } catch (error: any) {
    console.error("Erro no Cron Job (Rápido):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}