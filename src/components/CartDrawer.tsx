'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, MessageCircle, Loader2, ChevronRight } from 'lucide-react'
import { useCart } from './CartContext'
import { TIPO_LABEL } from '@/lib/utils'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { items, add, remove, clear } = useCart()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 300)
  }, [open])

  const finalizar = async () => {
    if (!name.trim()) {
      setError('Informe seu nome para continuar.')
      nameRef.current?.focus()
      return
    }
    if (items.length === 0) {
      setError('Adicione ao menos um item ao carrinho.')
      return
    }

    setError('')
    setLoading(true)

    const res = await fetch('/api/pedidos/publico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: name.trim(),
        items: items.map((i) => ({ id: i.id, qty: i.quantity })),
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao registrar pedido. Tente novamente.')
      return
    }

    // Salva na sessionStorage para a página de confirmação
    sessionStorage.setItem(
      'ru_confirmacao',
      JSON.stringify({ guestName: name.trim(), orders: data.orders, createdAt: new Date().toISOString() })
    )

    clear()
    onClose()
    router.push('/confirmar')
  }

  const tipoColor: Record<string, string> = {
    ALMOCO: 'bg-orange-100 text-orange-700',
    JANTAR: 'bg-blue-100 text-blue-700',
    LANCHE: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer — sobe do fundo em mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[90vh] flex flex-col
        sm:right-0 sm:top-0 sm:bottom-auto sm:left-auto sm:w-96 sm:rounded-l-3xl sm:rounded-tr-none sm:max-h-screen
        ${open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full'}`}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Seu Pedido</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum item adicionado</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{item.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${tipoColor[item.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TIPO_LABEL[item.tipo] ?? item.tipo}
                      </span>
                      <span className="text-xs text-gray-400">{item.horario}</span>
                    </div>
                  </div>
                  {/* Stepper */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => remove(item.id)}
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center text-gray-700 font-bold text-base leading-none transition-colors"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-black text-green-700 text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => add({ id: item.id, nome: item.nome, tipo: item.tipo, horario: item.horario, descricao: item.descricao })}
                      className="w-7 h-7 bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg flex items-center justify-center text-white font-bold text-base leading-none transition-colors"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Checkout */}
        {items.length > 0 && (
          <div className="px-5 pb-6 pt-3 border-t border-gray-100 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Seu nome <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                placeholder="Como você se chama?"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && finalizar()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}

            <button
              onClick={finalizar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-md"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  Enviar pelo WhatsApp
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Seu pedido será registrado e o WhatsApp da empresa abrirá automaticamente
            </p>
          </div>
        )}
      </div>
    </>
  )
}
