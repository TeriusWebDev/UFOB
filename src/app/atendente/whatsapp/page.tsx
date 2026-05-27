'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, RefreshCw, WifiOff, Loader2, RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface QRState {
  ready: boolean
  qrImage: string | null
  error: string | null
  phone: string | null
}

export default function WhatsAppPage() {
  const [state, setState] = useState<QRState>({ ready: false, qrImage: null, error: null, phone: null })
  const [loading, setLoading] = useState(true)
  const [restarting, setRestarting] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/qr')
      if (!res.ok) return
      const data = await res.json()
      setState(data)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQR() }, [fetchQR])

  useEffect(() => {
    if (state.ready) return
    const interval = setInterval(fetchQR, 5000)
    return () => clearInterval(interval)
  }, [state.ready, fetchQR])

  const handleRestart = async (reset = false) => {
    setRestarting(true)
    setState({ ready: false, qrImage: null, error: null, phone: null })
    setLoading(true)
    await fetch(`/api/whatsapp/restart${reset ? '?reset=1' : ''}`, { method: 'POST' })
    // aguarda um pouco para o socket inicializar antes de fazer poll
    await new Promise((r) => setTimeout(r, 3000))
    await fetchQR()
    setRestarting(false)
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">WhatsApp Bot</h1>
        <p className="text-gray-500 text-sm">Conectar o bot ao número do RU</p>
      </div>

      {/* Status */}
      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            state.ready ? 'bg-green-100' : state.error ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {loading || restarting ? (
              <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
            ) : state.ready ? (
              <CheckCircle className="w-7 h-7 text-green-600" />
            ) : state.error ? (
              <AlertTriangle className="w-7 h-7 text-red-500" />
            ) : (
              <WifiOff className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">
              {restarting ? 'Reiniciando...' : loading ? 'Verificando...' : state.ready ? 'Bot Conectado' : state.error ? 'Erro na Conexão' : 'Bot Desconectado'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {state.ready
                ? 'Mensagens e pedidos funcionando normalmente'
                : state.qrImage
                ? 'Aguardando leitura do QR code'
                : state.error
                ? state.error
                : 'Aguardando QR code...'}
            </p>
            {lastRefresh && !state.ready && (
              <p className="text-xs text-gray-400 mt-0.5">
                Atualizado às {lastRefresh.toLocaleTimeString('pt-BR')} · auto-refresh em 5s
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* QR Code */}
      {!state.ready && !restarting && (
        <Card className="mb-4">
          {state.qrImage ? (
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-semibold text-gray-700 mb-1">Escaneie com o WhatsApp</p>
              <p className="text-xs text-gray-400 mb-4">
                Abra o WhatsApp → Dispositivos Conectados → Conectar dispositivo
              </p>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3 mb-4">
                <Image
                  src={state.qrImage}
                  alt="QR code WhatsApp"
                  width={280}
                  height={280}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Aguardando leitura... (QR atualiza automaticamente)</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              {loading ? (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Conectando...</span>
                </div>
              ) : (
                <>
                  <WifiOff className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 mb-1">QR code não disponível</p>
                  <p className="text-xs text-gray-400">Clique em "Reiniciar" abaixo para gerar um novo QR.</p>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Connected */}
      {state.ready && (
        <Card className="mb-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">WhatsApp conectado!</p>
              {state.phone && (
                <p className="text-base font-black text-green-700 mt-1 tracking-wide">
                  +{state.phone}
                </p>
              )}
              <p className="text-sm text-green-700 mt-1">
                O bot está ativo. Alunos podem enviar mensagens para o número conectado e fazer pedidos.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Ações */}
      <div className="space-y-2">
        <Button variant="secondary" fullWidth onClick={fetchQR} loading={loading} disabled={restarting}>
          <RefreshCw className="w-4 h-4" />
          Atualizar agora
        </Button>

        <Button variant="secondary" fullWidth onClick={() => handleRestart(false)} loading={restarting} disabled={loading}>
          <RotateCcw className="w-4 h-4" />
          Reiniciar conexão
        </Button>

        <button
          onClick={() => {
            if (confirm('Isso vai apagar a sessão atual e gerar um novo QR code. Continuar?')) {
              handleRestart(true)
            }
          }}
          disabled={restarting || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Resetar sessão (novo QR)
        </button>
      </div>

      {/* Instruções */}
      <Card className="mt-4">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Como conectar</h3>
        <ol className="space-y-2.5">
          {[
            ['Clique em "Reiniciar conexão"', 'Se o QR não aparecer automaticamente'],
            ['Aguarde o QR aparecer', 'Pode levar alguns segundos'],
            ['Abra o WhatsApp', 'No celular do número do RU'],
            ['Escaneie o QR', 'Menu → Dispositivos Conectados → Conectar dispositivo'],
            ['Pronto!', 'A sessão é salva em whatsapp_auth/ e reconecta automaticamente'],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </main>
  )
}
