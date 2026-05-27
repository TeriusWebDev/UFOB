import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dataStrHoje } from '@/lib/utils'

export async function GET() {
  try {
    const hoje = dataStrHoje()
    const pedidos = await db.order.findMany({
      include: { customer: true, menuItem: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ pedidos, hoje })
  } catch (err) {
    console.error('[GET /api/pedidos]', err)
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 })
  }
}
