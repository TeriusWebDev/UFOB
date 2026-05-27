import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gerarCodigo4Digitos, dataStrHoje } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { guestName, itemIds } = await req.json()

    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
    }
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'Nenhum item selecionado.' }, { status: 400 })
    }

    const dataStr = dataStrHoje()

    // Fetch menu items and validate availability
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: itemIds }, disponivel: true },
      include: { _count: { select: { orders: true } } },
    })

    if (menuItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item disponível encontrado.' }, { status: 400 })
    }

    const orders: { codigoRetirada: string; menuItem: { nome: string; tipo: string; horario: string } }[] = []

    for (const menuItem of menuItems) {
      const vagasRestantes = menuItem.vagas - menuItem._count.orders
      if (vagasRestantes <= 0) continue

      // Generate unique 4-digit code for today (retry up to 20 times on collision)
      let codigoRetirada = ''
      let attempts = 0
      while (attempts < 20) {
        const candidate = gerarCodigo4Digitos()
        const exists = await db.order.findUnique({ where: { codigoRetirada_dataStr: { codigoRetirada: candidate, dataStr } } })
        if (!exists) { codigoRetirada = candidate; break }
        attempts++
      }
      if (!codigoRetirada) {
        return NextResponse.json({ error: 'Não foi possível gerar código único. Tente novamente.' }, { status: 500 })
      }

      await db.order.create({
        data: {
          codigoRetirada,
          dataStr,
          guestName: guestName.trim(),
          menuItemId: menuItem.id,
          origem: 'SITE',
        },
      })

      orders.push({
        codigoRetirada,
        menuItem: { nome: menuItem.nome, tipo: menuItem.tipo, horario: menuItem.horario },
      })
    }

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Todos os itens selecionados estão esgotados.' }, { status: 400 })
    }

    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[POST /api/pedidos/publico]', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
