import { Customer, MenuItem, Order, Staff } from '@prisma/client'

export type OrderWithDetails = Order & {
  customer: Customer | null
  menuItem: MenuItem
}

export type MenuItemWithCount = MenuItem & {
  _count: { orders: number }
}

export type StaffSession = {
  id: string
  name?: string | null
  matricula: string
  role: string
}
