import { NextResponse } from 'next/server'

// Tratada diretamente em server.js (thread principal, onde o bot Baileys roda).
export async function GET() {
  return NextResponse.json({ ready: false, state: 'unknown', qr: null })
}
