import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    message: "Cron Job temporariamente desativado durante refatoração para múltiplos cursos.",
    usersProcessed: 0,
    streaksReset: 0,
    plansReorganized: 0
  });
}