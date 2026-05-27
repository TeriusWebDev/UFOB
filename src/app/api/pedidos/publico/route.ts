import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gerarCodigo4Digitos, dataStrHoje } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { guestName } = body

    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
    }

    // Aceita o novo formato { items: [{id, qty}] } ou o legado { itemIds: string[] }
    let itemsList: { id: string; qty: number }[]
    if (Array.isArray(body.items) && body.items.length > 0) {
      itemsList = body.items.map((i: any) => ({ id: String(i.id), qty: Math.max(1, Number(i.qty) || 1) }))
    } else if (Array.isArray(body.itemIds) && body.itemIds.length > 0) {
      itemsList = body.itemIds.map((id: string) => ({ id, qty: 1 }))
    } else {
      return NextResponse.json({ error: 'Nenhum item selecionado.' }, { status: 400 })
    }

    const dataStr = dataStrHoje()

    // Busca os itens do cardápio e valida disponibilidade
    const menuItems = await db.menuItem.findMany({
      where: { id: { in: itemsList.map((i) => i.id) }, disponivel: true },
      include: { _count: { select: { orders: { where: { status: { not: 'CANCELADO' } } } } } },
    })

    if (menuItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum item disponível encontrado.' }, { status: 400 })
    }

    // Gera 1 único código para todo o pedido (checkout)
    let codigoRetirada = ''
    let attempts = 0
    while (attempts < 20) {
      const candidate = gerarCodigo4Digitos()
      const exists = await db.order.findFirst({
        where: { codigoRetirada: candidate, dataStr },
      })
      if (!exists) { codigoRetirada = candidate; break }
      attempts++
    }
    if (!codigoRetirada) {
      return NextResponse.json({ error: 'Não foi possível gerar código único. Tente novamente.' }, { status: 500 })
    }

    const orders: { codigoRetirada: string; menuItem: { nome: string; tipo: string; horario: string } }[] = []

    for (const { id, qty } of itemsList) {
      const menuItem = menuItems.find((m) => m.id === id)
      if (!menuItem) continue

      const vagasRestantes = menuItem.vagas - menuItem._count.orders
      if (vagasRestantes <= 0) continue

      const toCreate = Math.min(qty, vagasRestantes)

      for (let i = 0; i < toCreate; i++) {
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
