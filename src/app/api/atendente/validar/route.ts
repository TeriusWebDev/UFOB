import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { codigo } = await req.json()

    if (!codigo || String(codigo).length !== 4) {
      return NextResponse.json({ error: 'Código deve ter 4 dígitos.' }, { status: 400 })
    }

    const doisDiasAtras = new Date()
    doisDiasAtras.setDate(doisDiasAtras.getDate() - 1)
    doisDiasAtras.setHours(0, 0, 0, 0)

    const pedidos = await db.order.findMany({
      where: {
        codigoRetirada: String(codigo),
        status: { not: 'CANCELADO' },
        createdAt: { gte: doisDiasAtras },
      },
      include: { customer: true, menuItem: true },
      orderBy: { createdAt: 'asc' },
    })

    if (pedidos.length === 0) {
      return NextResponse.json(
        { error: `Código ${codigo} não encontrado. Verifique e tente novamente.` },
        { status: 404 }
      )
    }

    const todosRetirados = pedidos.every((p) => p.status === 'RETIRADO')
    if (todosRetirados) {
      const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(
        new Date(pedidos[0].retiradoEm!)
      )
      return NextResponse.json({ error: `Pedido já foi retirado às ${hora}.`, pedidos }, { status: 400 })
    }

    const ids = pedidos.filter((p) => p.status !== 'RETIRADO').map((p) => p.id)
    const retiradoEm = new Date()
    await db.order.updateMany({
      where: { id: { in: ids } },
      data: { status: 'RETIRADO', retiradoEm },
    })

    const atualizados = await db.order.findMany({
      where: { id: { in: ids } },
      include: { customer: true, menuItem: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ pedidos: atualizados })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao validar pedido.' }, { status: 500 })
  }
}
