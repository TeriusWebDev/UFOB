import { NextResponse } from 'next/server'

// Tratada diretamente em server.js (thread principal, onde o bot Baileys roda).
export async function POST() {
  return NextResponse.json({ ok: false, error: 'Use o servidor customizado.' })
}
