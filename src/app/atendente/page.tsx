'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { QrCode, List, Clock, Wifi, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TIPO_LABEL } from '@/lib/utils'

interface PorPrato {
  nome: string
  tipo: string
  vagas: number
  pendentes: number
  retirados: number
  total: number
}

interface PorTipo {
  tipo: string
  pendentes: number
  retirados: number
  total: number
}

interface Stats {
  totalHoje: number
  confirmados: number
  retirados: number
  totalClientes: number
  porPrato: PorPrato[]
  porTipo: PorTipo[]
}

// Ordem de exibição dos tipos
const TIPO_ORDER = ['ALMOCO', 'JANTAR', 'LANCHE']

const TIPO_COLORS: Record<string, { badge: string; header: string; bar: string }> = {
  ALMOCO: { badge: 'bg-orange-100 text-orange-700', header: 'border-orange-200 bg-orange-50', bar: 'bg-orange-400' },
  JANTAR: { badge: 'bg-blue-100 text-blue-700',   header: 'border-blue-200 bg-blue-50',   bar: 'bg-blue-400'   },
  LANCHE: { badge: 'bg-yellow-100 text-yellow-700', header: 'border-yellow-200 bg-yellow-50', bar: 'bg-yellow-400' },
}
const TIPO_COLORS_DEFAULT = { badge: 'bg-gray-100 text-gray-600', header: 'border-gray-200 bg-gray-50', bar: 'bg-gray-400' }

export default function AtendenteDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const dataFmt = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  }).format(new Date())

  const carregar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/api/atendente/stats')
      if (r.ok) {
        const data = await r.json()
        setStats(data)
        setLastUpdate(new Date())
      }
    } catch { /* silencioso */ } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const id = setInterval(() => carregar(true), 15000)
    return () => clearInterval(id)
  }, [carregar])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) carregar(true) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [carregar])

  // Ordena os tipos disponíveis conforme TIPO_ORDER (tipos extras vão ao fim)
  const tiposOrdenados = stats
    ? [
        ...TIPO_ORDER.filter((t) => stats.porTipo.some((p) => p.tipo === t)),
        ...stats.porTipo.map((p) => p.tipo).filter((t) => !TIPO_ORDER.includes(t)),
      ]
    : []

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm capitalize">{dataFmt}</p>
        </div>
        <button
          onClick={() => carregar()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          title={lastUpdate ? `Atualizado às ${lastUpdate.toLocaleTimeString('pt-BR')}` : ''}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdate
            ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : 'Atualizar'}
        </button>
      </div>

      {/* Cards de contagem global */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {loading && !stats ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl p-4 h-20 animate-pulse" />
          ))
        ) : (
          <>
            <Stat label="Pedidos Hoje" value={stats?.totalHoje ?? 0} color="blue" />
            <Stat label="Aguardando" value={stats?.confirmados ?? 0} color="yellow" />
            <Stat label="Retirados" value={stats?.retirados ?? 0} color="green" />
            <Stat label="Clientes WA" value={stats?.totalClientes ?? 0} color="gray" />
          </>
        )}
      </div>

      {/* ── Pedidos por Tipo ──────────────────────────────────── */}
      {tiposOrdenados.length > 0 && (
        <div className="mb-8 space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
            Pedidos por Tipo — Hoje
          </h2>

          {tiposOrdenados.map((tipo) => {
            const tipoStats = stats!.porTipo.find((p) => p.tipo === tipo)!
            const pratos = stats!.porPrato.filter((p) => p.tipo === tipo)
            const colors = TIPO_COLORS[tipo] ?? TIPO_COLORS_DEFAULT
            const percentRetirado = tipoStats.total > 0
              ? Math.round((tipoStats.retirados / tipoStats.total) * 100)
              : 0
            const percentPendente = tipoStats.total > 0
              ? Math.round((tipoStats.pendentes / tipoStats.total) * 100)
              : 0

            return (
              <div key={tipo}>
                {/* Cabeçalho do tipo */}
                <div className={`rounded-2xl border px-4 py-3 mb-3 ${colors.header}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${colors.badge}`}>
                        {TIPO_LABEL[tipo] ?? tipo}
                      </span>
                      {/* Barra de progresso compacta */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/70 rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${percentRetirado}%` }}
                          />
                          <div
                            className="h-full bg-blue-400 transition-all"
                            style={{ width: `${percentPendente}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-black text-2xl ${tipoStats.pendentes === 0 ? 'text-gray-300' : 'text-blue-700'}`}>
                        {tipoStats.pendentes}
                      </span>
                      <div className="text-xs leading-tight text-right">
                        <p className="text-blue-600 font-semibold">aguardando</p>
                        <p className="text-green-600 font-semibold">✓ {tipoStats.retirados} retirados</p>
                        <p className="text-gray-400">{tipoStats.total} total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cards por prato dentro do tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                  {pratos.map((p) => {
                    const percentOcupPrato = p.vagas > 0 ? Math.round((p.retirados / p.vagas) * 100) : 0
                    const percentPendPrato = p.vagas > 0 ? Math.round((p.pendentes / p.vagas) * 100) : 0
                    return (
                      <div
                        key={p.nome}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{p.nome}</p>
                            {/* Barra: verde = retirados, azul = pendentes */}
                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${percentOcupPrato}%` }}
                                title={`${p.retirados} retirados`}
                              />
                              <div
                                className="h-full bg-blue-400 transition-all"
                                style={{ width: `${percentPendPrato}%` }}
                                title={`${p.pendentes} aguardando`}
                              />
                            </div>
                            <div className="flex gap-3 mt-1.5 text-xs">
                              <span className="flex items-center gap-1 text-green-700 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                {p.retirados} ret.
                              </span>
                              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                {p.pendentes} ag.
                              </span>
                              <span className="text-gray-400">{p.total} total</span>
                            </div>
                          </div>
                          {/* Número principal = pendentes */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-2xl font-black transition-all ${p.pendentes === 0 ? 'text-gray-200' : 'text-blue-700'}`}>
                              {p.pendentes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ações rápidas */}
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
  const colors = {
    blue:   'bg-blue-50 text-blue-900',
    yellow: 'bg-yellow-50 text-yellow-900',
    green:  'bg-green-50 text-green-900',
    gray:   'bg-gray-100 text-gray-700',
  }
  return (
    <div className={`${colors[color]} rounded-2xl p-4 text-center`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-70">{label}</p>
    </div>
  )
}

function ActionCard({ href, icon, bg, title, desc }: {
  href: string
  icon: React.ReactNode
  bg: string
  title: string
  desc: string
}) {
  return (
    <Link href={href}>
      <Card padding="lg" className="hover:border-green-200 transition-colors cursor-pointer active:scale-[0.98]">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
