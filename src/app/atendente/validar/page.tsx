'use client'

import { useState, useRef, FormEvent, KeyboardEvent } from 'react'
import { CheckCircle, XCircle, Search, RotateCcw, Hash } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatarDataHora, TIPO_LABEL } from '@/lib/utils'

type Estado = 'idle' | 'loading' | 'sucesso' | 'erro' | 'jaRetirado'

interface PedidoInfo {
  id: string
  codigoRetirada: string
  status: string
  createdAt: string
  retiradoEm?: string
  guestName?: string | null
  origem?: string
  customer?: { name: string; phone: string } | null
  menuItem: { nome: string; tipo: string; horario: string }
}

export default function ValidarPage() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [estado, setEstado] = useState<Estado>('idle')
  const [mensagem, setMensagem] = useState('')
  const [pedido, setPedido] = useState<PedidoInfo | null>(null)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const codigo = digits.join('')

  const handleDigit = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[idx] = value.slice(-1)
    setDigits(newDigits)
    if (value && idx < 3) inputRefs[idx + 1].current?.focus()
  }

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus()
    }
    if (e.key === 'Enter' && codigo.length === 4) validar()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (paste.length > 0) {
      const newDigits = ['', '', '', '']
      paste.split('').forEach((ch, i) => { newDigits[i] = ch })
      setDigits(newDigits)
      inputRefs[Math.min(paste.length, 3)].current?.focus()
    }
    e.preventDefault()
  }

  const validar = async () => {
    if (codigo.length !== 4) return
    setEstado('loading')
    setPedido(null)

    const res = await fetch('/api/atendente/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    })

    const data = await res.json()

    if (!res.ok) {
      setPedido(data.pedido ?? null)
      setEstado(data.pedido?.status === 'RETIRADO' ? 'jaRetirado' : 'erro')
      setMensagem(data.error ?? 'Erro ao validar.')
      return
    }

    setPedido(data)
    setEstado('sucesso')
  }

  const reiniciar = () => {
    setDigits(['', '', '', ''])
    setEstado('idle')
    setPedido(null)
    setMensagem('')
    setTimeout(() => inputRefs[0].current?.focus(), 100)
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Validar Pedido</h1>
        <p className="text-gray-500 text-sm">Digite o código de 4 dígitos do aluno</p>
      </div>

      <Card className="mb-4">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-3 text-center">
              Código de Retirada
            </label>
            {/* 4-digit input */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  autoFocus={idx === 0}
                  onChange={(e) => handleDigit(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-16 h-20 text-center text-3xl font-black font-mono rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                />
              ))}
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            loading={estado === 'loading'}
            disabled={codigo.length !== 4}
            onClick={validar}
          >
            <Search className="w-5 h-5" />
            Validar e Confirmar Retirada
          </Button>
        </div>
      </Card>

      {/* Sucesso */}
      {estado === 'sucesso' && pedido && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-black text-green-800 text-lg">Retirada Confirmada!</p>
              <p className="text-green-600 text-sm">Pedido marcado como retirado</p>
            </div>
          </div>
          <PedidoCard pedido={pedido} />
          <Button variant="secondary" fullWidth onClick={reiniciar}>
            <RotateCcw className="w-4 h-4" />
            Validar outro código
          </Button>
        </div>
      )}

      {/* Já retirado */}
      {estado === 'jaRetirado' && pedido && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <XCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-yellow-800">Atenção</p>
              <p className="text-yellow-700 text-sm">{mensagem}</p>
            </div>
          </div>
          <PedidoCard pedido={pedido} />
          <Button variant="secondary" fullWidth onClick={reiniciar}>
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Erro */}
      {estado === 'erro' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800">Código não encontrado</p>
              <p className="text-red-600 text-sm">{mensagem}</p>
            </div>
          </div>
          <Button variant="secondary" fullWidth onClick={reiniciar}>
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Idle hint */}
      {estado === 'idle' && (
        <div className="text-center py-10">
          <Hash className="w-16 h-16 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Peça ao cliente o código de 4 dígitos do pedido
          </p>
        </div>
      )}
    </main>
  )
}

function PedidoCard({ pedido }: { pedido: PedidoInfo }) {
  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono font-black text-green-700 text-2xl tracking-widest">
            {pedido.codigoRetirada}
          </span>
          <Badge status={pedido.status} />
        </div>
        <div className="space-y-2">
          <Row label="Nome" value={pedido.customer?.name ?? pedido.guestName ?? '—'} />
          {pedido.customer?.phone && (
            <Row label="WhatsApp" value={formatPhone(pedido.customer.phone)} />
          )}
          {pedido.origem && (
            <Row label="Origem" value={pedido.origem === 'SITE' ? 'Site' : 'WhatsApp'} />
          )}
          <Row label="Refeição" value={pedido.menuItem.nome} />
          <Row
            label="Tipo"
            value={TIPO_LABEL[pedido.menuItem.tipo] ?? pedido.menuItem.tipo}
          />
          <Row label="Horário" value={pedido.menuItem.horario} />
          <Row label="Pedido em" value={formatarDataHora(new Date(pedido.createdAt))} />
          {pedido.retiradoEm && (
            <Row
              label="Retirado em"
              value={formatarDataHora(new Date(pedido.retiradoEm))}
              green
            />
          )}
        </div>
      </div>
    </Card>
  )
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-xs font-medium">{label}</span>
      <span className={`font-semibold text-xs text-right ${green ? 'text-green-700' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

function formatPhone(phone: string) {
  // 5577999990001 → +55 77 9 9999-0001
  const d = phone.replace(/\D/g, '')
  if (d.length === 13)
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 5)} ${d.slice(5, 9)}-${d.slice(9)}`
  return phone
}
