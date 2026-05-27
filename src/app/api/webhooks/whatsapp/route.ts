import { NextResponse } from 'next/server'

// Webhook não é mais utilizado — o bot roda via Baileys diretamente no processo Node.js.
export async function POST() {
  return NextResponse.json({ ok: true })
}
