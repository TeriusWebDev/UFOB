'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodigoRetiradaProps {
  codigo: string
  size?: 'md' | 'lg'
}

export function CodigoRetirada({ codigo, size = 'md' }: CodigoRetiradaProps) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    await navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
        Código de Retirada
      </p>
      <div
        className={`
          bg-green-600 rounded-2xl px-8 py-5 text-center shadow-lg cursor-pointer
          active:scale-95 transition-transform select-all
          ${size === 'lg' ? 'px-10 py-6' : ''}
        `}
        onClick={copiar}
      >
        <span
          className={`
            font-mono font-black text-white tracking-[0.25em]
            ${size === 'lg' ? 'text-4xl' : 'text-3xl'}
          `}
        >
          {codigo}
        </span>
      </div>
      <button
        onClick={copiar}
        className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
      >
        {copiado ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Toque para copiar</span>
          </>
        )}
      </button>
    </div>
  )
}
