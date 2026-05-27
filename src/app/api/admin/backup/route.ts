import { NextResponse } from 'next/server'

function getBackupModule() {
  return require('@/lib/backup') as {
    runBackup: () => Promise<{ success: boolean; file?: string; sizeMB?: string; error?: string }>
    listBackups: () => Array<{ name: string; sizeBytes: number; createdAt: string }>
  }
}

export async function GET() {
  try {
    const { listBackups } = getBackupModule()
    return NextResponse.json(listBackups())
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { runBackup } = getBackupModule()
    const result = await runBackup()
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
