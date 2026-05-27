'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export interface CartItem {
  id: string        // menuItemId
  nome: string
  tipo: string
  horario: string
  descricao?: string | null
}

interface CartContextType {
  items: CartItem[]
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
  isInCart: (id: string) => boolean
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const add = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items])

  return (
    <CartContext.Provider value={{ items, add, remove, clear, isInCart, count: items.length }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve estar dentro de CartProvider')
  return ctx
}
