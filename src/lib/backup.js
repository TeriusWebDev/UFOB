const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const RETENTION_DAYS = 7

function pad(n) {
  return String(n).padStart(2, '0')
}

function timestamp() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`
}

async function runBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Banco não encontrado em ${DB_PATH}`)
    }

    fs.mkdirSync(BACKUP_DIR, { recursive: true })

    const destName = `backup-${timestamp()}.db`
    const destPath = path.join(BACKUP_DIR, destName)

    fs.copyFileSync(DB_PATH, destPath)

    const sizeMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2)
    console.log(`✅ [Backup] ${destName} (${sizeMB} MB)`)

    // Limpeza: remove backups mais antigos que RETENTION_DAYS
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000

    const arquivos = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))

    let deletados = 0
    for (const f of arquivos) {
      const filePath = path.join(BACKUP_DIR, f)
      const mtime = fs.statSync(filePath).mtimeMs
      if (mtime < cutoff) {
        fs.unlinkSync(filePath)
        deletados++
        console.log(`🗑️  [Backup] Removido (>${RETENTION_DAYS}d): ${f}`)
      }
    }

    console.log(`📦 [Backup] ${arquivos.length - deletados} arquivo(s) retidos`)
    return { success: true, file: destName, sizeMB }
  } catch (err) {
    console.error('❌ [Backup] Erro:', err.message)
    return { success: false, error: err.message }
  }
}

function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return []

    return fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup-') && f.endsWith('.db'))
      .map((f) => {
        const filePath = path.join(BACKUP_DIR, f)
        const stat = fs.statSync(filePath)
        return {
          name: f,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch {
    return []
  }
}

function scheduleDailyBackup() {
  const now = new Date()
  const next2AM = new Date()
  next2AM.setHours(2, 0, 0, 0)

  // Se já passou das 02:00 hoje, agenda para amanhã
  if (next2AM <= now) {
    next2AM.setDate(next2AM.getDate() + 1)
  }

  const ms = next2AM - now
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)

  console.log(`📅 [Backup] Agendado para 02:00 (em ${h}h ${m}min) · retenção ${RETENTION_DAYS} dias`)

  setTimeout(() => {
    runBackup()
    setInterval(runBackup, 24 * 60 * 60 * 1000)
  }, ms)
}

module.exports = { runBackup, listBackups, scheduleDailyBackup }
