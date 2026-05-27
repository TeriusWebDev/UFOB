import { AtendenteNavbar } from '@/components/AtendenteNavbar'

export default function AtendenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AtendenteNavbar />
      <div className="pt-16">{children}</div>
    </div>
  )
}
