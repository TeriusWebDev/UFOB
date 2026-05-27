'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, Download, RefreshCw, CheckCircle, AlertCircle, Clock, HardDrive } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BackupFile {
  name: string
  sizeBytes: number
  createdAt: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const fetchBackups = useCallback(async () => {
    const res = await fetch('/api/admin/backup')
    if (res.ok) {
      const data = await res.json()
      setBackups(Array.isArray(data) ? data : [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchBackups() }, [fetchBackups])

  const runManual = async () => {
    setRunning(true)
    setLastResult(null)

    const res = await fetch('/api/admin/backup', { method: 'POST' })
    const data = await res.json()

    setRunning(false)

    if (res.ok) {
      setLastResult({ ok: true, msg: `Backup criado: ${data.file} (${data.sizeMB} MB)` })
      fetchBackups()
    } else {
      setLastResult({ ok: false, msg: data.error ?? 'Erro ao criar backup' })
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  }

  // Extrai a data do nome do arquivo backup-YYYY-MM-DD_HH-MM.db
  function labelFromName(name: string) {
    const match = name.match(/backup-(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})/)
    if (!match) return name
    const [, date, time] = match
    const [y, m, d] = date.split('-')
    const [hh, mm] = time.split('-')
    return `${d}/${m}/${y} às ${hh}:${mm}`
  }

  const totalSize = backups.reduce((acc, b) => acc + b.sizeBytes, 0)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Backups</h1>
        <p className="text-gray-500 text-sm">Backup automático às 02:00 · retenção de 7 dias</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <InfoCard
          icon={<Database className="w-4 h-4 text-blue-600" />}
          label="Backups"
          value={String(backups.length)}
          bg="bg-blue-50"
        />
        <InfoCard
          icon={<HardDrive className="w-4 h-4 text-purple-600" />}
          label="Espaço total"
          value={formatSize(totalSize)}
          bg="bg-purple-50"
        />
        <InfoCard
          icon={<Clock className="w-4 h-4 text-green-600" />}
          label="Próximo"
          value="02:00"
          bg="bg-green-50"
        />
      </div>

      {/* Resultado do backup manual */}
      {lastResult && (
        <div
          className={`flex items-start gap-2 rounded-2xl px-4 py-3 mb-4 text-sm ${
            lastResult.ok
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {lastResult.ok
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          }
          <span>{lastResult.msg}</span>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2 mb-5">
        <Button onClick={runManual} loading={running} className="flex-1">
          <Database className="w-4 h-4" />
          Fazer Backup Agora
        </Button>
        <Button variant="secondary" onClick={fetchBackups} loading={loading}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Lista de backups */}
      <div className="space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : backups.length === 0 ? (
          <Card className="text-center py-10">
            <Database className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum backup encontrado</p>
            <p className="text-gray-400 text-xs mt-1">
              O primeiro backup automático será feito às 02:00 de amanhã,<br />
              ou clique em "Fazer Backup Agora"
            </p>
          </Card>
        ) : (
          backups.map((b, idx) => (
            <Card key={b.name} padding="none">
              <div className="px-4 py-3 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    idx === 0 ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <Database className={`w-4 h-4 ${idx === 0 ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {labelFromName(b.name)}
                    </p>
                    {idx === 0 && (
                      <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                        mais recente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{b.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-600">{formatSize(b.sizeBytes)}</p>
                  <p className="text-xs text-gray-400">{formatDate(b.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {backups.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Backups ficam em <code className="bg-gray-100 px-1 rounded">backups/</code> na raiz do projeto.
          Arquivos com mais de 7 dias são removidos automaticamente.
        </p>
      )}
    </main>
  )
}

function InfoCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
}) {
  return (
    <div className={`${bg} rounded-2xl p-3 text-center`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-black text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
