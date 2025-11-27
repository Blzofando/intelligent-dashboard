import { NextRequest, NextResponse } from 'next/server';
import { courses } from '@/data/courses';
import lessonDurationsJSON from '@/data/lessonDurations.json';
import { StudySettings, StudyPlanDay, Lesson } from '@/types';

const lessonDurations: Record<string, number> = lessonDurationsJSON;

const RHYTHM_TARGETS_SECONDS = {
  suave: 30 * 60,     // 1800
  regular: 60 * 60,   // 3600
  intensivo: 90 * 60, // 5400
  personalizado: 60 * 60 // Default fallback
};

// --- Funções Helper (Calculadora Rápida) ---
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = { 'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6 };

function createMasterPlan(
  completedLessons: Set<string>,
  targetDuration: number,
  selectedCourseIds: string[],
  courseDistribution: Record<string, number>
): StudyPlanDay[] {

  // 1. Preparar filas de aulas por curso
  const courseQueues: Record<string, { id: string; title: string; duration: number; courseId: string }[]> = {};

  selectedCourseIds.forEach(courseId => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    courseQueues[courseId] = [];

    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (completedLessons.has(lesson.id)) {
          continue;
        }
        // Tenta pegar a duração exata do JSON. Se não achar, fallback 300s.
        // O JSON tem chaves como "pbi-F001" ou "lic-F01".
        // O lesson.id do curso já deve vir com prefixo correto se o arquivo de dados estiver certo.
        // No caso do PowerBI, vimos que o arquivo power-bi.ts tem "pbi-F001".
        // No caso de Licitação, "lic-F01".
        // Então deve bater direto com o JSON.
        const duration = lessonDurations[lesson.id] || 300;
        courseQueues[courseId].push({ ...lesson, duration, courseId });
      }
    }
  });

  const masterPlan: StudyPlanDay[] = [];
  let hasLessons = true;

  while (hasLessons) {
    let currentDayLessons: { id: string; title: string; duration: number; courseId: string }[] = [];
    let lessonsAddedThisDay = 0;

    // Para cada curso, pega uma fatia de tempo baseada na distribuição
    selectedCourseIds.forEach(courseId => {
      const queue = courseQueues[courseId];
      if (!queue || queue.length === 0) return;

      const pct = courseDistribution[courseId] || (100 / selectedCourseIds.length);
      const courseTimeBudget = (targetDuration * pct) / 100;

      let currentCourseDuration = 0;

      // Adiciona aulas até estourar o budget do curso ou acabar as aulas
      while (queue.length > 0) {
        const lesson = queue[0];
        // Se já adicionamos pelo menos uma aula e a próxima estoura muito o tempo, paramos.
        // Mas para garantir progresso, sempre adicionamos pelo menos uma se o budget permitir ou se for a primeira.
        if (currentCourseDuration > 0 && (currentCourseDuration + lesson.duration) > (courseTimeBudget * 1.2)) {
          break;
        }

        currentDayLessons.push(queue.shift()!);
        currentCourseDuration += lesson.duration;
        lessonsAddedThisDay++;
      }
    });

    if (lessonsAddedThisDay === 0) {
      hasLessons = false;
    } else {
      masterPlan.push({ date: "TBD", lessons: currentDayLessons });
    }
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
    // Avança até achar um dia permitido
    while (!allowedDays.has(currentDate.getUTCDay())) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    finalPlan.push({
      date: formatDate(currentDate),
      lessons: masterDay.lessons
    });
    // Avança para o próximo dia para a próxima iteração
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

    const targetDurationInSeconds = settings.mode === 'personalizado'
      ? (settings.minutesPerDay || 60) * 60
      : (RHYTHM_TARGETS_SECONDS[settings.mode] || 3600);

    // Se não tiver cursos selecionados, usa o padrão (Power BI) ou todos?
    // Vamos assumir que o front manda. Se não mandar, fallback para todos.
    let selectedIds = settings.selectedCourses || [];
    if (selectedIds.length === 0) {
      selectedIds = courses.map(c => c.id);
    }

    // Se não tiver distribuição, divide igual
    let distribution = settings.courseDistribution || {};
    if (Object.keys(distribution).length === 0) {
      const share = 100 / selectedIds.length;
      selectedIds.forEach(id => distribution[id] = share);
    }

    const masterPlan = createMasterPlan(
      completedLessonSet,
      targetDurationInSeconds,
      selectedIds,
      distribution
    );

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