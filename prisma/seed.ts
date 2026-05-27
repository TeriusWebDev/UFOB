import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const senhaHash = await bcrypt.hash('123456', 12)

  await db.staff.upsert({
    where: { matricula: 'ATD001' },
    update: {},
    create: {
      name: 'Maria Atendente',
      matricula: 'ATD001',
      password: senhaHash,
      role: 'ATENDENTE',
    },
  })

  await db.staff.upsert({
    where: { matricula: 'ADM001' },
    update: {},
    create: {
      name: 'Admin RU',
      matricula: 'ADM001',
      password: senhaHash,
      role: 'ADMIN',
    },
  })

  const hoje = new Date()
  hoje.setHours(12, 0, 0, 0)

  const menuItems = [
    {
      nome: 'Arroz, Feijão, Frango Grelhado e Salada',
      descricao: 'Arroz branco, feijão carioca, frango grelhado e salada mista',
      tipo: 'ALMOCO',
      data: hoje,
      horario: '11:00 - 14:00',
      disponivel: true,
      vagas: 100,
      preco: 0,
    },
    {
      nome: 'Arroz, Feijão, Carne Assada e Salada',
      descricao: 'Arroz branco, feijão carioca, carne assada ao molho e salada',
      tipo: 'ALMOCO',
      data: hoje,
      horario: '11:00 - 14:00',
      disponivel: true,
      vagas: 80,
      preco: 0,
    },
    {
      nome: 'Marmita Vegetariana',
      descricao: 'Arroz integral, feijão, legumes refogados e salada verde',
      tipo: 'ALMOCO',
      data: hoje,
      horario: '11:00 - 14:00',
      disponivel: true,
      vagas: 30,
      preco: 0,
    },
    {
      nome: 'Jantar — Macarrão ao Molho e Salada',
      descricao: 'Macarrão parafuso ao molho de tomate com carne moída',
      tipo: 'JANTAR',
      data: hoje,
      horario: '18:00 - 20:00',
      disponivel: true,
      vagas: 60,
      preco: 0,
    },
  ]

  for (const item of menuItems) {
    await db.menuItem.create({ data: item })
  }

  console.log('✅ Seed concluído!')
  console.log('👤 Atendente: ATD001 / 123456')
  console.log('👤 Admin:     ADM001 / 123456')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
