import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({
        message: "Reorganização temporariamente desativada durante refatoração para múltiplos cursos."
    });
}