import { courses } from '@/data/courses';
import { CoursePlan, StudyPlan, StudySettings, Lesson } from '@/types';
import lessonDurationsJSON from '@/data/lessonDurations.json';

const lessonDurations: Record<string, number> = lessonDurationsJSON;

const RHYTHM_TARGETS_SECONDS = {
    suave: 30 * 60,     // 1800
    regular: 60 * 60,   // 3600
    intensivo: 90 * 60, // 5400
    personalizado: 60 * 60 // Default fallback
};

type DayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';
const allDaysMap: Record<DayKey, number> = {
    'dom': 0, 'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6
};

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Reorganiza o plano de estudos de um curso
 * @param coursePlan - Plano atual do curso
 * @param courseId - ID do curso
 * @param missedLessonIds - IDs das aulas que ficaram pendentes (vão para o início)
 * @param completedLessons - Todas as aulas já completadas pelo usuário
 * @returns Novo plano reorganizado
 */
export async function reorganizePlan(
    coursePlan: CoursePlan,
    courseId: string,
    missedLessonIds: string[],
    completedLessons: string[]
): Promise<StudyPlan> {
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        throw new Error(`Curso ${courseId} não encontrado`);
    }

    const completedSet = new Set(completedLessons);
    const settings = coursePlan.settings;

    // 1. Coletar todas as lições não completadas do curso
    const allIncompleteLessons: Array<{ id: string; title: string; duration: number; courseId: string }> = [];

    for (const module of course.modules) {
        for (const lesson of module.lessons) {
            if (!completedSet.has(lesson.id)) {
                const duration = lessonDurations[lesson.id] || 300;
                allIncompleteLessons.push({
                    id: lesson.id,
                    title: lesson.title,
                    duration,
                    courseId
                });
            }
        }
    }

    // 2. Separar as lições missed (prioridade) das outras
    const priorityLessons = allIncompleteLessons.filter(l => missedLessonIds.includes(l.id));
    const otherLessons = allIncompleteLessons.filter(l => !missedLessonIds.includes(l.id));

    // 3. Reordenar: prioridade primeiro, depois o resto
    const reorderedLessons = [...priorityLessons, ...otherLessons];

    if (reorderedLessons.length === 0) {
        // Nenhuma lição pendente, retorna plano vazio
        return {
            plan: [],
            expectedCompletionDate: formatDate(new Date())
        };
    }

    // 4. Determinar tempo por dia baseado no modo
    const targetDurationInSeconds = settings.mode === 'personalizado'
        ? (settings.minutesPerDay || 60) * 60
        : (RHYTHM_TARGETS_SECONDS[settings.mode] || 3600);

    // 5. Criar dias de estudo (master plan)
    const masterPlan: Array<{ date: string; lessons: typeof reorderedLessons }> = [];
    let currentIndex = 0;

    while (currentIndex < reorderedLessons.length) {
        const dayLessons: typeof reorderedLessons = [];
        let currentDayDuration = 0;

        // Adiciona lições até preencher o tempo do dia
        while (currentIndex < reorderedLessons.length) {
            const lesson = reorderedLessons[currentIndex];

            // Se já adicionamos pelo menos uma aula e a próxima estoura muito o tempo, paramos
            if (dayLessons.length > 0 && (currentDayDuration + lesson.duration) > (targetDurationInSeconds * 1.2)) {
                break;
            }

            dayLessons.push(lesson);
            currentDayDuration += lesson.duration;
            currentIndex++;
        }

        if (dayLessons.length > 0) {
            masterPlan.push({ date: "TBD", lessons: dayLessons });
        }
    }

    // 6. Aplicar cronograma do usuário (dias da semana permitidos)
    const finalPlan: StudyPlan['plan'] = [];
    const allowedDays = new Set(settings.daysOfWeek.map(d => allDaysMap[d]));

    // Começar a partir de HOJE (não do passado)
    let currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0); // Normalizar para meio-dia

    for (const masterDay of masterPlan) {
        // Avança até achar um dia permitido
        while (!allowedDays.has(currentDate.getUTCDay())) {
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        finalPlan.push({
            date: formatDate(currentDate),
            lessons: masterDay.lessons
        });

        // Avança para o próximo dia
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const expectedCompletionDate = finalPlan.length > 0
        ? finalPlan[finalPlan.length - 1].date
        : formatDate(new Date());

    return {
        plan: finalPlan,
        expectedCompletionDate
    };
}
