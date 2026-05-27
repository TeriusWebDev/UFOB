import { db } from '@/lib/db'
import Link from 'next/link'
import { QrCode, List, Clock, Wifi } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export default async function AtendenteDashboard() {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const [totalHoje, confirmados, retirados, totalClientes] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: hoje, lt: amanha } } }),
    db.order.count({ where: { createdAt: { gte: hoje, lt: amanha }, status: 'CONFIRMADO' } }),
    db.order.count({ where: { createdAt: { gte: hoje, lt: amanha }, status: 'RETIRADO' } }),
    db.customer.count(),
  ])

  const dataFmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  }).format(new Date())

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm capitalize">{dataFmt}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Pedidos Hoje" value={totalHoje} color="blue" />
        <Stat label="Aguardando" value={confirmados} color="yellow" />
        <Stat label="Retirados" value={retirados} color="green" />
        <Stat label="Clientes WA" value={totalClientes} color="gray" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ActionCard href="/atendente/validar" icon={<QrCode className="w-7 h-7 text-green-700" />} bg="bg-green-100" title="Validar Código" desc="Confirmar retirada de pedido" />
        <ActionCard href="/atendente/pedidos" icon={<List className="w-7 h-7 text-blue-700" />} bg="bg-blue-100" title="Ver Pedidos" desc="Lista e busca de pedidos" />
        <ActionCard href="/atendente/cardapio" icon={<Clock className="w-7 h-7 text-purple-700" />} bg="bg-purple-100" title="Cardápio" desc="Gerenciar refeições do dia" />
        <ActionCard href="/atendente/whatsapp" icon={<Wifi className="w-7 h-7 text-emerald-700" />} bg="bg-emerald-100" title="Status WhatsApp" desc="Verificar bot e conexão" />
      </div>
    </main>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: 'blue' | 'yellow' | 'green' | 'gray' }) {
  const colors = { blue: 'bg-blue-50 text-blue-900', yellow: 'bg-yellow-50 text-yellow-900', green: 'bg-green-50 text-green-900', gray: 'bg-gray-100 text-gray-700' }
  return (
    <div className={`${colors[color]} rounded-2xl p-4 text-center`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-70">{label}</p>
    </div>
  )
}

function ActionCard({ href, icon, bg, title, desc }: { href: string; icon: React.ReactNode; bg: string; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card padding="lg" className="hover:border-green-200 transition-colors cursor-pointer active:scale-[0.98]">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
