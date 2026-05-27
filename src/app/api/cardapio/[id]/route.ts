import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().nullable().optional(),
  foto: z.string().nullable().optional(),
  tipo: z.enum(['ALMOCO', 'JANTAR', 'LANCHE']).optional(),
  data: z.string().optional(),
  horario: z.string().optional(),
  vagas: z.number().int().min(1).max(9999).optional(),
  disponivel: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = patchSchema.parse(body)
    const item = await db.menuItem.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { orders: true } } },
    })
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await db.menuItem.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
