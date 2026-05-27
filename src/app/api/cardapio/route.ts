import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dataParam = searchParams.get('data')

  const base = dataParam ? new Date(dataParam) : new Date()
  const startOfDay = new Date(base)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(base)
  endOfDay.setHours(23, 59, 59, 999)

  const items = await db.menuItem.findMany({
    where: { data: { gte: startOfDay, lte: endOfDay }, disponivel: true },
    include: { _count: { select: { orders: true } } },
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const item = await db.menuItem.create({ data: body })
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 })
  }
}
