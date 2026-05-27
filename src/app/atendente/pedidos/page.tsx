'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatarDataHora, TIPO_LABEL } from '@/lib/utils'
import type { OrderWithDetails } from '@/lib/types'

const TABS = ['HOJE', 'TODOS', 'CONFIRMADO', 'RETIRADO', 'CANCELADO']

export default function AtendentePedidosPage() {
  const [pedidos, setPedidos] = useState<OrderWithDetails[]>([])
  const [hoje, setHoje] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('HOJE')
  const [busca, setBusca] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const carregar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/pedidos')
      const data = await r.json()
      if (!r.ok || data.error) {
        setError(data.error ?? 'Erro ao carregar pedidos.')
        return
      }
      setPedidos(Array.isArray(data.pedidos) ? data.pedidos : [])
      setHoje(data.hoje ?? '')
      setLastUpdate(new Date())
    } catch {
      setError('Falha de conexão com o servidor.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // Auto-refresh a cada 15 segundos
  useEffect(() => {
    const id = setInterval(() => carregar(true), 15000)
    return () => clearInterval(id)
  }, [carregar])

  const byStatus = (s: string) => pedidos.filter((p) => p.status === s)
  const todayOrders = pedidos.filter((p) => p.dataStr === hoje)

  const tabCount = (t: string) => {
    if (t === 'HOJE') return todayOrders.length
    if (t === 'TODOS') return pedidos.length
    return byStatus(t).length
  }

  const filtered = pedidos.filter((p) => {
    const matchTab =
      filtro === 'TODOS'
        ? true
        : filtro === 'HOJE'
        ? p.dataStr === hoje
        : p.status === filtro

    const nomeDisplay = p.customer?.name ?? (p as any).guestName ?? ''
    const matchBusca =
      !busca ||
      p.codigoRetirada.includes(busca) ||
      nomeDisplay.toLowerCase().includes(busca.toLowerCase()) ||
      (p.customer?.phone ?? '').includes(busca)

    return matchTab && matchBusca
  })

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm">
            {lastUpdate
              ? `Atualizado às ${lastUpdate.toLocaleTimeString('pt-BR')} · auto-refresh 15s`
              : `${pedidos.length} pedidos no total`}
          </p>
        </div>
        <button
          onClick={() => carregar()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar por código, nome ou WhatsApp..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const count = tabCount(t)
          return (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filtro === t
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {t === 'HOJE' ? 'Hoje' : t === 'TODOS' ? 'Todos' : t === 'CONFIRMADO' ? 'Confirmado' : t === 'RETIRADO' ? 'Retirado' : 'Cancelado'}
              {' '}
              <span className={`font-black ${filtro === t ? 'text-white' : count > 0 && t === 'CONFIRMADO' ? 'text-blue-600' : count > 0 && t === 'RETIRADO' ? 'text-green-600' : 'text-gray-400'}`}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Nenhum pedido encontrado</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} padding="none">
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono font-black text-green-700 text-base tracking-wider">
                      {p.codigoRetirada}
                    </span>
                    <Badge status={p.status} />
                    <span className="text-xs text-gray-400">
                      {TIPO_LABEL[(p.menuItem as any).tipo] ?? (p.menuItem as any).tipo}
                    </span>
                    {p.dataStr !== hoje && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                        {p.dataStr}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {p.customer?.name ?? (p as any).guestName ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{(p.menuItem as any).nome}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{formatarDataHora(new Date(p.createdAt))}</p>
                  {(p as any).retiradoEm && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ {formatarDataHora(new Date((p as any).retiradoEm))}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
