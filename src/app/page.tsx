'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Plus, Utensils, Clock, Users, ShieldCheck } from 'lucide-react'
import { CartDrawer } from '@/components/CartDrawer'
import { useCart } from '@/components/CartContext'
import { TIPO_LABEL } from '@/lib/utils'

interface MenuItem {
  id: string
  nome: string
  descricao: string | null
  foto: string | null
  tipo: string
  horario: string
  disponivel: boolean
  vagas: number
  _count: { orders: number }
}

export default function HomePage() {
  const { add, remove, getQty, count } = useCart()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetch('/api/cardapio')
      .then((r) => r.json())
      .then((data) => { setMenuItems(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  const tipos = ['TODOS', ...Array.from(new Set(menuItems.map((i) => i.tipo)))]
  const filtered = filtro === 'TODOS' ? menuItems : menuItems.filter((i) => i.tipo === filtro)

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-none">Marmitaria</p>
              <p className="text-xs text-gray-400 leading-none">Nobre Sabor</p>
            </div>
          </div>

          {/* Cart button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrinho</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {/* Date */}
        <div className="mb-4">
          <h1 className="text-xl font-black text-gray-900">Cardápio de Hoje</h1>
          <p className="text-sm text-gray-500 capitalize">{hoje}</p>
        </div>

        {/* Tipo filters */}
        {tipos.length > 2 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {tipos.map((t) => (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filtro === t
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : TIPO_LABEL[t] ?? t}
              </button>
            ))}
          </div>
        )}

        {/* Menu items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Utensils className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum item disponível hoje</p>
            <p className="text-gray-400 text-sm mt-1">Volte mais tarde</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const vagasRestantes = item.vagas - item._count.orders
              const esgotado = vagasRestantes <= 0
              const qty = getQty(item.id)

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    qty > 0 ? 'border-green-400 shadow-md shadow-green-100' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  {/* Item photo */}
                  {item.foto && (
                    <div className="w-full h-36 overflow-hidden">
                      <img src={item.foto} alt={item.nome} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <TipoBadge tipo={item.tipo} />
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {item.horario}
                          </span>
                          {!esgotado && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Users className="w-3 h-3" />
                              {vagasRestantes} vagas
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{item.nome}</h3>
                        {item.descricao && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                            {item.descricao}
                          </p>
                        )}
                      </div>

                      {/* Controle de quantidade */}
                      {esgotado ? (
                        <button
                          disabled
                          className="flex-shrink-0 px-3 py-2 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                        >
                          Esgotado
                        </button>
                      ) : qty === 0 ? (
                        <button
                          onClick={() => add({
                            id: item.id,
                            nome: item.nome,
                            tipo: item.tipo,
                            horario: item.horario,
                            descricao: item.descricao,
                          })}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </button>
                      ) : (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <button
                            onClick={() => remove(item.id)}
                            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center text-gray-700 font-bold text-lg leading-none transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center font-black text-green-700 text-base tabular-nums">
                            {qty}
                          </span>
                          <button
                            onClick={() => qty < vagasRestantes && add({
                              id: item.id,
                              nome: item.nome,
                              tipo: item.tipo,
                              horario: item.horario,
                              descricao: item.descricao,
                            })}
                            disabled={qty >= vagasRestantes}
                            className="w-8 h-8 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg flex items-center justify-center text-white font-bold text-lg leading-none transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom spacer + atendente link */}
        <div className="mt-10 text-center">
          <Link
            href="/atendente/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Acesso ao painel do atendente
          </Link>
        </div>
      </main>

      {/* Floating cart button (when items in cart) */}
      {count > 0 && !drawerOpen && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-30 px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl shadow-xl font-bold text-base transition-all active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            Ver Pedido
            <span className="bg-white text-green-700 text-sm font-black w-7 h-7 rounded-xl flex items-center justify-center">
              {count}
            </span>
          </button>
        </div>
      )}

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

function TipoBadge({ tipo }: { tipo: string }) {
  const colors: Record<string, string> = {
    ALMOCO: 'bg-orange-100 text-orange-700',
    JANTAR: 'bg-blue-100 text-blue-700',
    LANCHE: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[tipo] ?? 'bg-gray-100 text-gray-600'}`}>
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  )
}
