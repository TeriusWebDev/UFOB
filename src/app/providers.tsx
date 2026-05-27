'use client'

import { CartProvider } from '@/components/CartContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}
