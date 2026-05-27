import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { codigo } = await req.json()

    if (!codigo || String(codigo).length !== 4) {
      return NextResponse.json({ error: 'Código deve ter 4 dígitos.' }, { status: 400 })
    }

    // Busca dentro dos últimos 2 dias para tolerar pedidos criados em virada de dia
    // (diferença de fuso UTC x BRT) sem restringir apenas ao dataStr de hoje.
    const doisDiasAtras = new Date()
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 1)
    doisDiasAtras.setHours(0, 0, 0, 0)

    const pedido = await db.order.findFirst({
      where: {
        codigoRetirada: String(codigo),
        status: { not: 'CANCELADO' },
        createdAt: { gte: doisDiasAtras },
      },
      include: { customer: true, menuItem: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!pedido) {
      return NextResponse.json(
        { error: `Código ${codigo} não encontrado. Verifique e tente novamente.` },
        { status: 404 }
      )
    }

    if (pedido.status === 'RETIRADO') {
      const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(pedido.retiradoEm!))
      return NextResponse.json({ error: `Pedido já foi retirado às ${hora}.`, pedido }, { status: 400 })
    }

    const updated = await db.order.update({
      where: { id: pedido.id },
      data: { status: 'RETIRADO', retiradoEm: new Date() },
      include: { customer: true, menuItem: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao validar pedido.' }, { status: 500 })
  }
}
