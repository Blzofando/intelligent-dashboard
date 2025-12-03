import { NextResponse } from 'next/server';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { UserProfile, DailyCheckResult } from '@/types';
import { reorganizePlan } from './reorganizePlanUtils';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Cron Job que roda à meia-noite (00:00 BRT)
 * Verifica o progresso dos usuários e toma ações:
 * 1. Penaliza se deixou aulas de ontem sem fazer (zera streak + reorganiza)
 * 2. Recompensa se completou ontem + fez >50% de hoje (mantém streak + reorganiza)
 */
export async function GET(request: Request) {
  try {
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    console.log(`[CRON] Executando verificação diária em ${today}`);

    // Buscar todos os usuários
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let usersProcessed = 0;
    let totalStreaksReset = 0;
    let totalPlansReorganized = 0;

    const processingPromises = usersSnapshot.docs.map(async (userDoc) => {
      try {
        const userId = userDoc.id;
        const userData = userDoc.data() as UserProfile;

        // Skip se já verificou hoje
        if (userData.lastDailyCheck === today) {
          console.log(`[CRON] Usuário ${userId} já verificado hoje`);
          return { processed: false };
        }

        const checkResults: DailyCheckResult[] = [];
        let userStreakReset = false;
        let userPlansReorganized = 0;

        // Para cada curso do usuário
        for (const [courseId, coursePlan] of Object.entries(userData.coursePlans || {})) {
          const yesterdayPlan = coursePlan.plan.plan.find(day => day.date === yesterday);

          // Se não tinha aula ontem nesse curso, skip
          if (!yesterdayPlan || yesterdayPlan.lessons.length === 0) {
            continue;
          }

          // ========================================
          // VERIFICAÇÃO 1: Lições Pendentes (PENALIZAÇÃO)
          // ========================================
          const missedLessons = yesterdayPlan.lessons.filter(
            lesson => !userData.completedLessons.includes(lesson.id)
          );

          if (missedLessons.length > 0) {
            console.log(`[CRON] Usuário ${userId} - Curso ${courseId}: ${missedLessons.length} aulas pendentes de ontem`);

            const streakBefore = userData.studyStreak || 0;

            // PENALIZAÇÃO: Zera streak
            userData.studyStreak = 0;
            userData.lastStreakUpdate = null;
            userStreakReset = true;

            // REORGANIZAR PLANO: Jogar lições pendentes para o próximo dia de estudo
            try {
              const newPlan = await reorganizePlan(
                coursePlan,
                courseId,
                missedLessons.map(l => l.id),
                userData.completedLessons
              );

              userData.coursePlans[courseId].plan = newPlan;
              userPlansReorganized++;

              checkResults.push({
                date: today,
                checkType: 'penalty',
                courseId,
                missedLessons: missedLessons.map(l => l.id),
                streakBefore,
                streakAfter: 0,
                planReorganized: true
              });

              console.log(`[CRON] Plano reorganizado para curso ${courseId} (penalização)`);
            } catch (error) {
              console.error(`[CRON] Erro ao reorganizar plano do curso ${courseId}:`, error);
              checkResults.push({
                date: today,
                checkType: 'penalty',
                courseId,
                missedLessons: missedLessons.map(l => l.id),
                streakBefore,
                streakAfter: 0,
                planReorganized: false
              });
            }

            // Pula verificação de recompensa se teve penalização
            continue;
          }

          // ========================================
          // VERIFICAÇÃO 2: Aproveitamento Antecipado (RECOMPENSA)
          // ========================================
          // Só roda se completou TODAS as lições de ontem
          const allYesterdayComplete = yesterdayPlan.lessons.every(
            lesson => userData.completedLessons.includes(lesson.id)
          );

          if (allYesterdayComplete) {
            // Verifica progresso de HOJE
            const todayPlan = coursePlan.plan.plan.find(day => day.date === today);

            if (todayPlan && todayPlan.lessons.length > 0) {
              const completedToday = todayPlan.lessons.filter(
                lesson => userData.completedLessons.includes(lesson.id)
              );

              const progressPercentage = (completedToday.length / todayPlan.lessons.length) * 100;

              if (progressPercentage >= 50) {
                // RECOMPENSA: Completou ontem + fez >50% de hoje
                console.log(`[CRON] Usuário ${userId} - Curso ${courseId}: ${progressPercentage.toFixed(1)}% de progresso hoje`);

                try {
                  const newPlan = await reorganizePlan(
                    coursePlan,
                    courseId,
                    [], // Sem lições pendentes, só reorganizar para avançar cronograma
                    userData.completedLessons
                  );

                  userData.coursePlans[courseId].plan = newPlan;
                  userPlansReorganized++;

                  checkResults.push({
                    date: today,
                    checkType: 'reward',
                    courseId,
                    advancedLessons: completedToday.map(l => l.id),
                    streakBefore: userData.studyStreak || 0,
                    streakAfter: userData.studyStreak || 0, // Mantém streak
                    planReorganized: true
                  });

                  console.log(`[CRON] Plano reorganizado para curso ${courseId} (recompensa)`);
                } catch (error) {
                  console.error(`[CRON] Erro ao reorganizar plano do curso ${courseId}:`, error);
                }
              } else {
                // NEUTRO: Completou ontem mas fez <50% de hoje
                console.log(`[CRON] Usuário ${userId} - Curso ${courseId}: ${progressPercentage.toFixed(1)}% de progresso (mantém plano)`);

                checkResults.push({
                  date: today,
                  checkType: 'neutral',
                  courseId,
                  streakBefore: userData.studyStreak || 0,
                  streakAfter: userData.studyStreak || 0, // Mantém streak
                  planReorganized: false
                });
              }
            }
          }
        }

        // Atualizar histórico
        const existingHistory = userData.dailyCheckHistory || [];
        const updatedHistory = [
          ...existingHistory.slice(-29), // Mantém últimos 30 dias
          ...checkResults
        ];

        // Salvar no Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          studyStreak: userData.studyStreak,
          lastStreakUpdate: userData.lastStreakUpdate,
          coursePlans: userData.coursePlans,
          lastDailyCheck: today,
          dailyCheckHistory: updatedHistory
        });

        console.log(`[CRON] Usuário ${userId} processado: ${checkResults.length} verificações`);

        if (userStreakReset) totalStreaksReset++;
        totalPlansReorganized += userPlansReorganized;
        usersProcessed++;

        return { processed: true };
      } catch (error) {
        console.error(`[CRON] Erro ao processar usuário ${userDoc.id}:`, error);
        return { processed: false, error };
      }
    });

    await Promise.all(processingPromises);

    const result = {
      success: true,
      message: `Verificação diária concluída em ${today}`,
      usersProcessed,
      streaksReset: totalStreaksReset,
      plansReorganized: totalPlansReorganized,
      timestamp: new Date().toISOString()
    };

    console.log('[CRON] Resultado:', result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[CRON] Erro crítico:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}