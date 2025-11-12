import { NextRequest, NextResponse } from 'next/server';
import { courseData } from '@/data/courseData'; 
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { StudySettings, StudyPlanDay, Lesson } from '@/types'; 

const lessonDurations: Record<string, number> = lessonDurationsJSON;

// 1. 'personalizado' REMOVIDO daqui
const RHYTHM_TARGETS_SECONDS = {
  suave: 30 * 60,     // 1800
  regular: 60 * 60,   // 3600
  intensivo: 90 * 60, // 5400
};

// --- Funções Helper (Calculadora Rápida) ---
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}
type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };

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
  let currentDate = new Date(settings.startDate + 'T12:00:00Z'); 
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
// --- Fim das Funções Helper ---

export async function POST(request: NextRequest) {
    try {
        const { settings, completedLessons } = await request.json() as { 
          settings: StudySettings, 
          completedLessons: string[] 
        };

        const completedLessonSet = new Set(completedLessons);
        
        // --- 2. A CORREÇÃO ESTÁ AQUI ---
        // Se for 'personalizado', usa o 'minutesPerDay'. 
        // Se não, busca no RHYTHM_TARGETS (ou 60 min como padrão).
        const targetDurationInSeconds = settings.mode === 'personalizado'
          ? (settings.minutesPerDay || 60) * 60
          : (RHYTHM_TARGETS_SECONDS[settings.mode] || 3600);
        // --- FIM DA CORREÇÃO ---

        const masterPlan = createMasterPlan(completedLessonSet, targetDurationInSeconds);
        const finalPlan = applyUserSchedule(masterPlan, settings);

        const expectedCompletionDate = finalPlan.length > 0 
          ? finalPlan[finalPlan.length - 1].date 
          : formatDate(new Date());

        const responseData = {
          plan: finalPlan,
          expectedCompletionDate: expectedCompletionDate
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("Erro na API generate-plan (Cálculo Rápido):", error);
        return NextResponse.json({ error: 'Erro ao gerar o plano de estudos' }, { status: 500 });
    }
}