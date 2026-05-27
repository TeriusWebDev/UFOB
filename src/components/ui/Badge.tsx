interface BadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDENTE: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONFIRMADO: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PRONTO: { label: 'Pronto', className: 'bg-green-100 text-green-800 border-green-200' },
  RETIRADO: { label: 'Retirado', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELADO: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
