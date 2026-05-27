'use client'

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import {
  Plus, Check, X, Pencil, ToggleLeft, ToggleRight, Trash2,
  ImagePlus, Loader2, Camera,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatarData, TIPO_LABEL } from '@/lib/utils'

interface MenuItem {
  id: string
  nome: string
  descricao?: string | null
  foto?: string | null
  tipo: string
  data: string
  horario: string
  disponivel: boolean
  vagas: number
  _count: { orders: number }
}

const TIPOS = ['ALMOCO', 'JANTAR', 'LANCHE']

const EMPTY_FORM = {
  nome: '',
  descricao: '',
  foto: '',
  tipo: 'ALMOCO',
  data: new Date().toISOString().split('T')[0],
  horario: '11:00 - 14:00',
  vagas: '100',
}

export default function AtendenteCardapioPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null })
  const [sucesso, setSucesso] = useState(false)

  const loadItems = () => {
    setLoading(true)
    fetch('/api/cardapio')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(loadItems, [])

  const openAdd = () => setModal({ open: true, item: null })
  const openEdit = (item: MenuItem) => setModal({ open: true, item })
  const closeModal = () => setModal({ open: false, item: null })

  const updateItem = async (id: string, patch: object) => {
    const res = await fetch(`/api/cardapio/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Remover este item do cardápio?')) return
    await fetch(`/api/cardapio/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const onSaved = (item: MenuItem, isNew: boolean) => {
    if (isNew) {
      setItems((prev) => [item, ...prev])
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    }
    closeModal()
    setSucesso(true)
    setTimeout(() => setSucesso(false), 3000)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Cardápio</h1>
          <p className="text-gray-500 text-sm">Gerenciar refeições disponíveis</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      {sucesso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-4 text-sm text-green-700">
          <Check className="w-4 h-4" /> Salvo com sucesso!
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Nenhum item no cardápio hoje.</p>
          <p className="text-sm mt-1">Clique em "Adicionar" para criar refeições.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onDelete={() => deleteItem(item.id)}
            />
          ))}
        </div>
      )}

      {modal.open && (
        <ItemModal
          item={modal.item}
          onSaved={onSaved}
          onClose={closeModal}
        />
      )}
    </main>
  )
}

// ─────────────────────────────────────────────
// Card de item com edição inline de vagas
// ─────────────────────────────────────────────

function MenuItemCard({
  item,
  onEdit,
  onUpdate,
  onDelete,
}: {
  item: MenuItem
  onEdit: () => void
  onUpdate: (patch: object) => Promise<void>
  onDelete: () => void
}) {
  const [editingVagas, setEditingVagas] = useState(false)
  const [vagasValue, setVagasValue] = useState(String(item.vagas))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setVagasValue(String(item.vagas))
    setEditingVagas(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 50)
  }

  const cancelEdit = () => {
    setEditingVagas(false)
    setVagasValue(String(item.vagas))
  }

  const saveVagas = async () => {
    const n = parseInt(vagasValue)
    if (isNaN(n) || n < 1 || n > 9999) return
    setSaving(true)
    await onUpdate({ vagas: n })
    setSaving(false)
    setEditingVagas(false)
  }

  const pedidos = item._count.orders
  const vagasRestantes = item.vagas - pedidos
  const percentUsado = Math.round((pedidos / item.vagas) * 100)

  return (
    <Card padding="none">
      <div className="flex gap-0">
        {/* Photo thumbnail */}
        {item.foto && (
          <div className="w-24 flex-shrink-0">
            <img
              src={item.foto}
              alt={item.nome}
              className="w-full h-full object-cover rounded-l-2xl"
            />
          </div>
        )}

        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {TIPO_LABEL[item.tipo] ?? item.tipo}
                </span>
                <span className="text-xs text-gray-400">{item.horario}</span>
                <span className="text-xs text-gray-400">{formatarData(new Date(item.data))}</span>
              </div>
              <p className={`font-bold text-sm ${!item.disponivel ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {item.nome}
              </p>
              {item.descricao && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.descricao}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                title="Editar item"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdate({ disponivel: !item.disponivel })}
                title={item.disponivel ? 'Desativar' : 'Ativar'}
                className={`p-1.5 rounded-lg transition-colors ${
                  item.disponivel ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {item.disponivel ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vagas */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{pedidos} pedidos</span>
                <span className={`text-xs font-bold ${vagasRestantes <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                  {vagasRestantes} restantes
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percentUsado >= 90 ? 'bg-red-500' : percentUsado >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentUsado, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {editingVagas ? (
                <>
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    max="9999"
                    value={vagasValue}
                    onChange={(e) => setVagasValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveVagas(); if (e.key === 'Escape') cancelEdit() }}
                    className="w-20 px-2 py-1 text-sm font-bold text-center border-2 border-green-500 rounded-lg focus:outline-none"
                  />
                  <button onClick={saveVagas} disabled={saving} className="p-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
                >
                  <span className="text-sm font-black text-gray-800">{item.vagas}</span>
                  <span className="text-xs text-gray-400">vagas</span>
                  <Pencil className="w-3 h-3 text-gray-300 group-hover:text-green-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Modal de adicionar / editar item
// ─────────────────────────────────────────────

function ItemModal({
  item,
  onSaved,
  onClose,
}: {
  item: MenuItem | null
  onSaved: (item: MenuItem, isNew: boolean) => void
  onClose: () => void
}) {
  const isNew = !item
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nome: item?.nome ?? '',
    descricao: item?.descricao ?? '',
    tipo: item?.tipo ?? 'ALMOCO',
    data: item?.data ? item.data.split('T')[0] : new Date().toISOString().split('T')[0],
    horario: item?.horario ?? '11:00 - 14:00',
    vagas: String(item?.vagas ?? 100),
  })
  const [fotoUrl, setFotoUrl] = useState<string>(item?.foto ?? '')
  const [fotoPreview, setFotoPreview] = useState<string>(item?.foto ?? '')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const preview = URL.createObjectURL(file)
    setFotoPreview(preview)

    // Upload
    setUploadingFoto(true)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploadingFoto(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao enviar imagem.')
      setFotoPreview(fotoUrl)
      return
    }
    setFotoUrl(data.url)
  }

  const removeFoto = () => {
    setFotoUrl('')
    setFotoPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) return

    setSalvando(true)
    setError('')

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      foto: fotoUrl || null,
      tipo: form.tipo,
      data: new Date(form.data + 'T12:00:00').toISOString(),
      horario: form.horario,
      vagas: parseInt(form.vagas),
    }

    let res: Response
    if (isNew) {
      res = await fetch('/api/cardapio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch(`/api/cardapio/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSalvando(false)

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Erro ao salvar.')
      return
    }

    const saved = await res.json()
    // Ensure _count exists for new items
    if (!saved._count) saved._count = { orders: 0 }
    onSaved(saved, isNew)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900">
              {isNew ? 'Nova Refeição' : 'Editar Refeição'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Photo upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Foto do prato <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              {fotoPreview ? (
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {uploadingFoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  {!uploadingFoto && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="p-2 bg-white/90 rounded-xl shadow hover:bg-white transition-colors"
                        title="Trocar foto"
                      >
                        <Camera className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={removeFoto}
                        className="p-2 bg-white/90 rounded-xl shadow hover:bg-white transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50 transition-colors text-gray-400 hover:text-green-600"
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm font-medium">Clique para adicionar foto</span>
                  <span className="text-xs">JPG, PNG ou WebP · máx. 5 MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={set('nome')}
                placeholder="Ex: Arroz, feijão e frango grelhado"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={set('descricao') as any}
                placeholder="Detalhes da refeição..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
              />
            </div>

            {/* Tipo + Vagas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={set('tipo') as any}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Vagas <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={form.vagas}
                  onChange={set('vagas')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            {/* Data + Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Data</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={set('data')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Horário</label>
                <input
                  type="text"
                  value={form.horario}
                  onChange={set('horario')}
                  placeholder="11:00 - 14:00"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </form>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="item-form"
              disabled={salvando || uploadingFoto}
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isNew ? 'Adicionar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
