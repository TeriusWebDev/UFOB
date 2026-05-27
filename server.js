const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || '127.0.0.1'
const port = parseInt(process.env.PORT || '43221', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  // Backup diário às 02:00
  try {
    const { scheduleDailyBackup } = require('./src/lib/backup')
    scheduleDailyBackup()
  } catch (err) {
    console.warn('⚠️  Backup automático não iniciado:', err.message)
  }

  // Inicia bot WhatsApp via Baileys (roda na thread principal)
  try {
    const { initWhatsApp } = require('./src/lib/whatsapp-baileys')
    initWhatsApp().catch((err) => console.error('[WA] Erro na inicialização:', err.message))
  } catch (err) {
    console.warn('⚠️  WhatsApp bot não iniciado:', err.message)
  }

  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname } = parsedUrl

    // ── Rotas WhatsApp tratadas diretamente na thread principal ──
    // (As rotas Next.js /api/whatsapp/* rodam em worker thread separado e
    //  não têm acesso ao globalThis desta thread.)

    if (pathname === '/api/whatsapp/qr' && req.method === 'GET') {
      const wa = globalThis.ruWA
      res.setHeader('Content-Type', 'application/json')
      if (!wa) {
        res.end(JSON.stringify({ ready: false, qrImage: null, error: 'Bot não inicializado. Verifique os logs do servidor.', phone: null }))
      } else {
        res.end(JSON.stringify({ ready: wa.ready ?? false, qrImage: wa.qrBase64 ?? null, error: wa.error ?? null, phone: wa.phone ?? null }))
      }
      return
    }

    if (pathname === '/api/whatsapp/status' && req.method === 'GET') {
      const wa = globalThis.ruWA ?? {}
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        ready: wa.ready ?? false,
        state: wa.ready ? 'open' : wa.error ? 'error' : 'connecting',
        qr: wa.qr ?? null,
        phone: wa.phone ?? null,
      }))
      return
    }

    if (pathname === '/api/whatsapp/phone' && req.method === 'GET') {
      const wa = globalThis.ruWA ?? {}
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ phone: wa.phone ?? process.env.NEXT_PUBLIC_WHATSAPP_EMPRESA ?? null }))
      return
    }

    if (pathname === '/api/whatsapp/restart' && req.method === 'POST') {
      const reset = parsedUrl.query.reset === '1'
      const wa = globalThis.ruWA
      if (reset && typeof wa?.reset === 'function') {
        wa.reset().catch(console.error)
      } else if (!reset && typeof wa?.restart === 'function') {
        wa.restart().catch(console.error)
      } else {
        console.warn('[WA] restart/reset chamado mas bot não está inicializado.')
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true }))
      return
    }
    // ─────────────────────────────────────────────────────────────

    try {
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error:', err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })
    .once('error', (err) => { console.error(err); process.exit(1) })
    .listen(port, () => {
      console.log(`\n🍽️  Marmitaria Nobre Sabor iniciado!`)
      console.log(`   Local: http://${hostname}:${port}`)
      console.log(`   Ambiente: ${dev ? 'desenvolvimento' : 'produção'}\n`)
    })
})
