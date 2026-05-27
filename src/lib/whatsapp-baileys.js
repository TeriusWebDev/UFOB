const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')
const QRCode = require('qrcode')

const AUTH_PATH = path.join(process.cwd(), 'whatsapp_auth')

const g = globalThis
if (!g.ruWA) {
  g.ruWA = {
    sock: null,
    ready: false,
    qr: null,
    qrBase64: null,
    error: null,
    _restarting: false,
    _connecting: false,
    restart: null,
    reset: null,
  }
}

if (!g._priWA) g._priWA = new PrismaClient()
const db = g._priWA

// ─────────────────────────────────────────────
// Inicialização Baileys
// ─────────────────────────────────────────────

async function initWhatsApp() {
  if (g.ruWA._connecting) {
    console.log('[WA] Já está conectando, ignorando chamada duplicada.')
    return
  }
  g.ruWA._connecting = true
  g.ruWA.ready = false
  g.ruWA.qr = null
  g.ruWA.qrBase64 = null
  g.ruWA.error = null

  console.log('[WA] Iniciando cliente WhatsApp (Baileys)...')

  try {
    const {
      makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      makeCacheableSignalKeyStore,
    } = await import('@whiskeysockets/baileys')
    const { Boom } = await import('@hapi/boom')
    const pino = require('pino')

    fs.mkdirSync(AUTH_PATH, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH)

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Marmitaria Nobre Sabor', 'Chrome', '120.0.0'],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    })

    g.ruWA.sock = sock
    g.ruWA._connecting = false

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        g.ruWA.qr = qr
        g.ruWA.ready = false
        try {
          g.ruWA.qrBase64 = await QRCode.toDataURL(qr)
        } catch (_) {}
        console.log('\n📱 QR gerado — acesse /atendente/whatsapp para escanear.\n')
      }

      if (connection === 'open') {
        g.ruWA.ready = true
        g.ruWA.qr = null
        g.ruWA.qrBase64 = null
        g.ruWA.error = null
        // Extrai número do JID: "5577999990000:10@s.whatsapp.net" → "5577999990000"
        const rawJid = sock.user?.id ?? ''
        const phone = rawJid.split(':')[0].replace('@s.whatsapp.net', '')
        if (phone) g.ruWA.phone = phone
        console.log(`✅ WhatsApp conectado! Número: ${phone || 'desconhecido'}\n`)
      }

      if (connection === 'close') {
        if (g.ruWA._restarting) return
        g.ruWA.ready = false
        g.ruWA.sock = null

        const statusCode = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : undefined

        const loggedOut = statusCode === DisconnectReason.loggedOut

        if (loggedOut) {
          console.log('[WA] Sessão encerrada (logout). Limpando credenciais e reconectando...')
          g.ruWA.error = 'Sessão encerrada. Escaneie o QR novamente.'
          try { fs.rmSync(AUTH_PATH, { recursive: true, force: true }) } catch (_) {}
          setTimeout(initWhatsApp, 2000)
        } else {
          console.log(`[WA] Desconectado (${statusCode}). Reconectando em 5s...`)
          g.ruWA.error = 'Desconectado. Reconectando...'
          setTimeout(initWhatsApp, 5000)
        }
      }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages) {
        if (msg.key.fromMe) continue
        const remoteJid = msg.key.remoteJid ?? ''
        if (remoteJid.includes('@g.us')) continue

        const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
        const text = (
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          ''
        ).trim()

        if (!phone || !text) continue

        try {
          await handleMessage(phone, text)
        } catch (err) {
          console.error('[WA] Erro ao processar mensagem:', err)
        }
      }
    })

  } catch (err) {
    g.ruWA._connecting = false
    g.ruWA.error = `Erro ao inicializar: ${err.message}`
    console.error('[WA] Erro ao inicializar:', err.message)
    setTimeout(initWhatsApp, 10000)
  }
}

async function restartWhatsApp() {
  console.log('[WA] Reiniciando conexão...')
  g.ruWA._restarting = true
  g.ruWA._connecting = false

  if (g.ruWA.sock) {
    try {
      if (typeof g.ruWA.sock.end === 'function') g.ruWA.sock.end()
      else if (g.ruWA.sock.ws) g.ruWA.sock.ws.close()
    } catch (_) {}
    g.ruWA.sock = null
  }

  g.ruWA.ready = false
  g.ruWA.qr = null
  g.ruWA.qrBase64 = null
  g.ruWA.error = null
  g.ruWA._restarting = false

  await initWhatsApp()
}

async function resetWhatsApp() {
  console.log('[WA] Resetando sessão (apagando credenciais)...')
  g.ruWA._restarting = true
  g.ruWA._connecting = false

  if (g.ruWA.sock) {
    try {
      if (typeof g.ruWA.sock.logout === 'function') await g.ruWA.sock.logout()
      else if (typeof g.ruWA.sock.end === 'function') g.ruWA.sock.end()
      else if (g.ruWA.sock.ws) g.ruWA.sock.ws.close()
    } catch (_) {}
    g.ruWA.sock = null
  }

  g.ruWA.ready = false
  g.ruWA.qr = null
  g.ruWA.qrBase64 = null
  g.ruWA.error = null
  g.ruWA._restarting = false

  try { fs.rmSync(AUTH_PATH, { recursive: true, force: true }) } catch (_) {}

  await initWhatsApp()
}

// Expõe as funções de controle no objeto global imediatamente ao carregar o módulo,
// para que as rotas da API possam chamá-las mesmo antes de initWhatsApp terminar.
g.ruWA.restart = restartWhatsApp
g.ruWA.reset = resetWhatsApp

// ─────────────────────────────────────────────
// Máquina de estados da conversa
// ─────────────────────────────────────────────

async function handleMessage(phone, text) {
  const input = text.trim()

  const conv = await db.conversationState.upsert({
    where: { phone },
    update: { updatedAt: new Date() },
    create: { phone, state: 'IDLE' },
  })

  if (conv.state === 'WAITING_NAME' && conv.pendingItemId) {
    const name = input
    if (name.length < 2 || name.length > 80 || /^\d+$/.test(name)) {
      await sendMsg(phone, 'Por favor, informe seu *nome completo* (somente letras, sem números).')
      return
    }
    let customer = await db.customer.findUnique({ where: { phone } })
    if (!customer) {
      customer = await db.customer.create({ data: { name, phone } })
    } else {
      customer = await db.customer.update({ where: { phone }, data: { name } })
    }
    await criarPedidoESendCodigo(phone, customer, conv.pendingItemId)
    await db.conversationState.update({ where: { phone }, data: { state: 'IDLE', pendingItemId: null } })
    return
  }

  const lower = input.toLowerCase()

  if (/^(meu(s)? pedido(s)?|hist[oó]rico)$/.test(lower)) {
    await sendMeusPedidos(phone)
    return
  }

  if (/^(cancelar|voltar|sair|stop)$/.test(lower)) {
    await db.conversationState.update({ where: { phone }, data: { state: 'IDLE', pendingItemId: null } })
    await sendMsg(phone, 'Ok! Digite *menu* para ver o cardápio de hoje. 🍽️')
    return
  }

  const num = parseInt(input)
  if (!isNaN(num) && num > 0 && num <= 9) {
    await handleSelecao(phone, num)
    return
  }

  await sendMenu(phone)
}

async function handleSelecao(phone, num) {
  const items = await getCardapioHoje()
  if (items.length === 0) {
    await sendMsg(phone, '😕 Não há itens disponíveis no cardápio hoje.')
    return
  }
  const selected = items[num - 1]
  if (!selected) {
    await sendMsg(phone, `Opção inválida. Escolha um número de *1* a *${items.length}*.\nDigite *menu* para ver o cardápio.`)
    return
  }
  const vagasRestantes = selected.vagas - selected._count.orders
  if (vagasRestantes <= 0) {
    await sendMsg(phone, `😔 *${selected.nome}* está esgotado.\nDigite *menu* para outras opções.`)
    return
  }
  const hoje = dataStrHoje()
  const duplicado = await db.order.findFirst({
    where: { customer: { phone }, dataStr: hoje, menuItemId: selected.id, status: { notIn: ['CANCELADO'] } },
  })
  if (duplicado) {
    await sendMsg(phone, `ℹ️ Você já pediu *${selected.nome}* hoje.\nSeu código: *${duplicado.codigoRetirada}*\n\nDigite *menu* para outras opções.`)
    return
  }
  const customer = await db.customer.findUnique({ where: { phone } })
  if (!customer) {
    await db.conversationState.upsert({
      where: { phone },
      update: { state: 'WAITING_NAME', pendingItemId: selected.id },
      create: { phone, state: 'WAITING_NAME', pendingItemId: selected.id },
    })
    await sendMsg(phone, `Para confirmar o pedido de *${selected.nome}*, preciso saber seu nome.\n\n📝 Informe seu *nome completo*:`)
    return
  }
  await criarPedidoESendCodigo(phone, customer, selected.id)
}

async function criarPedidoESendCodigo(phone, customer, menuItemId) {
  const item = await db.menuItem.findUnique({
    where: { id: menuItemId },
    include: { _count: { select: { orders: { where: { status: { not: 'CANCELADO' } } } } } },
  })
  if (!item || !item.disponivel) {
    await sendMsg(phone, '😔 Item indisponível. Digite *menu* para ver outras opções.')
    return
  }
  if (item._count.orders >= item.vagas) {
    await sendMsg(phone, `😔 *${item.nome}* está esgotado. Digite *menu* para outras opções.`)
    return
  }
  const hoje = dataStrHoje()
  let codigo = null
  for (let i = 0; i < 20; i++) {
    const tentativa = String(Math.floor(1000 + Math.random() * 9000))
    const existe = await db.order.findFirst({ where: { codigoRetirada: tentativa, dataStr: hoje } })
    if (!existe) { codigo = tentativa; break }
  }
  if (!codigo) {
    await sendMsg(phone, '⚠️ Erro ao gerar código. Tente novamente.')
    return
  }
  await db.order.create({
    data: { codigoRetirada: codigo, dataStr: hoje, customerId: customer.id, menuItemId: item.id, status: 'CONFIRMADO', origem: 'WHATSAPP' },
  })
  const tipoLabel = { ALMOCO: 'Almoço', JANTAR: 'Jantar', LANCHE: 'Lanche' }
  await sendMsg(phone,
    `✅ *Pedido Confirmado!*\n\nOlá, *${customer.name}*! 👋\n\n🍽️ *${item.nome}*\n🏷️ ${tipoLabel[item.tipo] || item.tipo}  ·  ⏰ ${item.horario}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n🎫 *SEU CÓDIGO DE RETIRADA:*\n\n          *${codigo}*\n\n━━━━━━━━━━━━━━━━━━━━\n` +
    `Informe este código ao atendente na hora de retirar.\n\n_Bom apetite! 🍴_`
  )
}

async function sendMenu(phone) {
  const items = await getCardapioHoje()
  if (items.length === 0) {
    await sendMsg(phone, '👋 Olá! Bem-vindo à *Marmitaria Nobre Sabor*.\n\n😕 Não há itens no cardápio hoje. Volte mais tarde!')
    return
  }
  const dataFmt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const tipoLabel = { ALMOCO: 'Almoço', JANTAR: 'Jantar', LANCHE: 'Lanche' }
  const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
  const byTipo = {}
  items.forEach((item, idx) => {
    if (!byTipo[item.tipo]) byTipo[item.tipo] = []
    byTipo[item.tipo].push({ ...item, idx })
  })
  let msg = `👋 *Marmitaria Nobre Sabor*\n📅 _${dataFmt}_\n\n🍽️ *Cardápio de Hoje*\n`
  for (const [tipo, tipoItems] of Object.entries(byTipo)) {
    msg += `\n*${tipoLabel[tipo] || tipo}*  ·  ⏰ ${tipoItems[0].horario}\n`
    for (const item of tipoItems) {
      const esgotado = item.vagas - item._count.orders <= 0
      msg += `${numEmoji[item.idx]} ${item.nome}${esgotado ? ' _(esgotado)_' : ''}\n`
    }
  }
  msg += `\nDigite o *número* da refeição para fazer seu pedido.`
  await sendMsg(phone, msg)
}

async function sendMeusPedidos(phone) {
  const customer = await db.customer.findUnique({ where: { phone } })
  if (!customer) {
    await sendMsg(phone, 'Você ainda não fez nenhum pedido. Digite *menu* para ver o cardápio. 🍽️')
    return
  }
  const pedidos = await db.order.findMany({
    where: { customerId: customer.id },
    include: { menuItem: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  if (pedidos.length === 0) {
    await sendMsg(phone, 'Você ainda não fez nenhum pedido. Digite *menu* para ver o cardápio. 🍽️')
    return
  }
  const icon = { CONFIRMADO: '🔵', PRONTO: '🟢', RETIRADO: '✅', CANCELADO: '❌' }
  let msg = `📋 *Seus últimos pedidos:*\n`
  for (const p of pedidos) {
    const data = new Date(p.createdAt).toLocaleDateString('pt-BR')
    msg += `\n${icon[p.status] || '⚪'} *${p.codigoRetirada}* — ${p.menuItem.nome}\n   _${data} · ${p.status}_\n`
  }
  await sendMsg(phone, msg)
}

async function getCardapioHoje() {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return db.menuItem.findMany({
    where: { data: { gte: start, lte: end }, disponivel: true },
    include: { _count: { select: { orders: { where: { status: { not: 'CANCELADO' } } } } } },
    orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
  })
}

function dataStrHoje() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function sendMsg(phone, text) {
  const sock = g.ruWA.sock
  if (!sock || !g.ruWA.ready) {
    console.warn(`[WA] Não conectado — msg para ${phone} não enviada`)
    return
  }
  const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
  await sock.sendMessage(jid, { text })
}

module.exports = { initWhatsApp, restartWhatsApp, resetWhatsApp }
