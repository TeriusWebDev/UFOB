import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dataStrHoje } from '@/lib/utils'

// Garante que o Next.js nunca cacheia esta rota — dados sempre frescos
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const hoje = dataStrHoje()
    const pedidos = await db.order.findMany({
      include: { customer: true, menuItem: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(
      { pedidos, hoje },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[GET /api/pedidos]', err)
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 })
  }
}
