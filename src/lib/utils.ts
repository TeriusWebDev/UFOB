/** Gera código de retirada de 4 dígitos (1000–9999), único por dia */
export function gerarCodigo4Digitos(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/** Retorna a data de hoje no formato "YYYY-MM-DD" (horário local) */
export function dataStrHoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatarData(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatarDataHora(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const TIPO_LABEL: Record<string, string> = {
  ALMOCO: 'Almoço',
  JANTAR: 'Jantar',
  LANCHE: 'Lanche',
}

export const STATUS_CONFIG: Record<string, { label: string }> = {
  CONFIRMADO: { label: 'Confirmado' },
  PRONTO: { label: 'Pronto para Retirada' },
  RETIRADO: { label: 'Retirado' },
  CANCELADO: { label: 'Cancelado' },
}
