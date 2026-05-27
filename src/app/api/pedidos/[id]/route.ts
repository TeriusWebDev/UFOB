import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const pedido = await db.order.findUnique({
    where: { id: params.id },
    include: { customer: true, menuItem: true },
  })
  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  return NextResponse.json(pedido)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const pedido = await db.order.update({
    where: { id: params.id },
    data: body,
    include: { customer: true, menuItem: true },
  })
  return NextResponse.json(pedido)
}
