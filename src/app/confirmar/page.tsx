'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, MessageCircle, Utensils, Clock, ArrowLeft } from 'lucide-react'
import { TIPO_LABEL } from '@/lib/utils'

interface OrderConfirmado {
  codigoRetirada: string
  menuItem: { nome: string; tipo: string; horario: string }
}

interface Confirmacao {
  guestName: string
  orders: OrderConfirmado[]
  createdAt: string
}

export default function ConfirmarPage() {
  const router = useRouter()
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null)
  const [waPhone, setWaPhone] = useState<string>(process.env.NEXT_PUBLIC_WHATSAPP_EMPRESA ?? '')

  useEffect(() => {
    const raw = sessionStorage.getItem('ru_confirmacao')
    if (!raw) { router.replace('/'); return }
    try {
      setConfirmacao(JSON.parse(raw))
    } catch {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    fetch('/api/whatsapp/phone')
      .then((r) => r.json())
      .then((d) => { if (d.phone) setWaPhone(d.phone) })
      .catch(() => {})
  }, [])

  if (!confirmacao) return null

  const { guestName, orders, createdAt } = confirmacao

  const data = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const whatsappNum = waPhone

  const codigoUnico = orders[0]?.codigoRetirada ?? ''

  const waMessage = [
    '🛒 *Novo Pedido - Marmitaria Nobre Sabor*',
    `👤 *Nome:* ${guestName}`,
    `📅 ${data}`,
    `🎫 *Código:* ${codigoUnico}`,
    '🍽️ *Itens:*',
    ...orders.map(
      (o, i) =>
        `${['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'][i] ?? `${i + 1}.`} ${o.menuItem.nome} (${TIPO_LABEL[o.menuItem.tipo] ?? o.menuItem.tipo} · ${o.menuItem.horario})`
    ),
    '_Pedido feito pelo site._',
  ].join('\n')

  const waUrl = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(waMessage)}`

  const tipoColor: Record<string, string> = {
    ALMOCO: 'bg-orange-100 text-orange-700',
    JANTAR: 'bg-blue-100 text-blue-700',
    LANCHE: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">Marmitaria</p>
              <p className="text-xs text-gray-400 leading-none">Nobre Sabor</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        {/* Success banner */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Pedido registrado!</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Olá, <strong>{guestName}</strong>. Guarde seus códigos abaixo.
          </p>
        </div>

        {/* Código único de retirada */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-6 py-5 mb-6 text-center">
          <p className="text-xs text-green-600 font-semibold mb-1">Código de Retirada</p>
          <p className="text-5xl font-black text-green-700 tracking-widest leading-none mb-2">
            {codigoUnico}
          </p>
          <p className="text-xs text-green-600">Apresente este código na retirada</p>
        </div>

        {/* Lista de itens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {orders.length === 1 ? '1 item' : `${orders.length} itens`}
          </p>
          <div className="space-y-3">
            {orders.map((order, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-300 font-mono text-xs w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-snug">{order.menuItem.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${tipoColor[order.menuItem.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TIPO_LABEL[order.menuItem.tipo] ?? order.menuItem.tipo}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {order.menuItem.horario}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">Confirme no WhatsApp</p>
          <p className="text-xs text-gray-500 mb-4">
            Envie seu pedido para o WhatsApp da Marmitaria para garantir sua reserva.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bc5a] active:bg-[#1da851] text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-md w-full"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar pelo WhatsApp
          </a>
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Voltar ao cardápio
        </Link>
      </main>
    </div>
  )
}
