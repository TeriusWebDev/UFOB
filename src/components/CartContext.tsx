'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export interface CartItem {
  id: string        // menuItemId
  nome: string
  tipo: string
  horario: string
  descricao?: string | null
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>) => void
  remove: (id: string) => void
  setQuantity: (id: string, qty: number) => void
  clear: () => void
  isInCart: (id: string) => boolean
  getQty: (id: string) => number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Incrementa qty se já existe, senão adiciona com qty=1
  const add = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  // Decrementa qty; remove o item quando chega a 0
  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter((i) => i.id !== id)
      return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }, [])

  // Define qty diretamente; qty <= 0 remove o item
  const setQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i))
    }
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items])

  const getQty = useCallback((id: string) => items.find((i) => i.id === id)?.quantity ?? 0, [items])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, setQuantity, clear, isInCart, getQty, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve estar dentro de CartProvider')
  return ctx
}
