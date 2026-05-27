import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dataStrHoje } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const dataHoje = dataStrHoje()

    const [totalHoje, confirmados, retirados, totalClientes, itensHoje, pedidosHoje] =
      await Promise.all([
        db.order.count({ where: { createdAt: { gte: hoje, lt: amanha } } }),
        db.order.count({ where: { createdAt: { gte: hoje, lt: amanha }, status: 'CONFIRMADO' } }),
        db.order.count({ where: { createdAt: { gte: hoje, lt: amanha }, status: 'RETIRADO' } }),
        db.customer.count(),
        // Itens do cardápio de hoje
        db.menuItem.findMany({
          where: { data: { gte: hoje, lt: amanha } },
          select: { id: true, nome: true, tipo: true, vagas: true },
          orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
        }),
        // Pedidos de hoje (não cancelados) com status
        db.order.findMany({
          where: { dataStr: dataHoje, status: { not: 'CANCELADO' } },
          select: { menuItemId: true, status: true },
        }),
      ])

    // Agrupa por prato com contagem separada de pendentes e retirados
    const porPrato = itensHoje
      .map((item) => {
        const orders = pedidosHoje.filter((o) => o.menuItemId === item.id)
        const pendentes = orders.filter((o) => o.status === 'CONFIRMADO').length
        const retirados = orders.filter((o) => o.status === 'RETIRADO').length
        return {
          nome: item.nome,
          tipo: item.tipo,
          vagas: item.vagas,
          pendentes,
          retirados,
          total: orders.length,
        }
      })
      .filter((p) => p.total > 0)

    // Agrupa por tipo (Almoço, Jantar, Lanche…)
    const tiposUnicos = Array.from(new Set(itensHoje.map((i) => i.tipo)))
    const porTipo = tiposUnicos
      .map((tipo) => {
        const pratosDoTipo = porPrato.filter((p) => p.tipo === tipo)
        const pendentes = pratosDoTipo.reduce((s, p) => s + p.pendentes, 0)
        const retirados = pratosDoTipo.reduce((s, p) => s + p.retirados, 0)
        const total = pratosDoTipo.reduce((s, p) => s + p.total, 0)
        return { tipo, pendentes, retirados, total }
      })
      .filter((t) => t.total > 0)

    return NextResponse.json(
      { totalHoje, confirmados, retirados, totalClientes, porPrato, porTipo },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    console.error('[GET /api/atendente/stats]', err)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas.' }, { status: 500 })
  }
}
