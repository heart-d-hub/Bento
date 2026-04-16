/**
 * Bento Hub — เซิร์ฟเวอร์กลางแบบ MVP สำหรับทดสอบบน PC ใน LAN
 *
 * รัน: npm start (จากโฟลเดอร์ server)
 * พอร์ต: BENTO_HUB_PORT (ค่าเริ่มต้น 3847)
 * โทเคน: BENTO_HUB_TOKEN (ค่าเริ่มต้น bento-dev-hub-token)
 *
 * ข้อมูลเก็บที่ server/data/state.json
 */
import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = process.env.BENTO_HUB_DATA_DIR
  ? path.resolve(process.env.BENTO_HUB_DATA_DIR)
  : path.join(ROOT, 'data')
const STATE_FILE = path.join(DATA_DIR, 'state.json')

const PORT = Number(process.env.BENTO_HUB_PORT || 3847)
const TOKEN = process.env.BENTO_HUB_TOKEN || 'bento-dev-hub-token'

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readState() {
  ensureDataDir()
  if (!fs.existsSync(STATE_FILE)) {
    return {
      revision: 0,
      updatedAt: null,
      updatedByBranch: null,
      productMaster: [],
      vehicleCatalog: null,
    }
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8')
    const p = JSON.parse(raw)
    return {
      revision: typeof p.revision === 'number' ? p.revision : 0,
      updatedAt: p.updatedAt ?? null,
      updatedByBranch: p.updatedByBranch ?? null,
      productMaster: Array.isArray(p.productMaster) ? p.productMaster : [],
      vehicleCatalog: p.vehicleCatalog ?? null,
    }
  } catch {
    return {
      revision: 0,
      updatedAt: null,
      updatedByBranch: null,
      productMaster: [],
      vehicleCatalog: null,
    }
  }
}

function writeStateAtomic(next) {
  ensureDataDir()
  const tmp = `${STATE_FILE}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 0), 'utf8')
  fs.renameSync(tmp, STATE_FILE)
}

function auth(req, res, nextFn) {
  const h = req.headers.authorization
  const bearer = h?.startsWith('Bearer ') ? h.slice(7).trim() : ''
  const q = typeof req.query?.token === 'string' ? req.query.token : ''
  const t = bearer || q
  if (!t || t !== TOKEN) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }
  nextFn()
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bento-hub', revision: readState().revision })
})

app.get('/api/v1/sync/pull', auth, (_req, res) => {
  const s = readState()
  res.json({
    ok: true,
    revision: s.revision,
    updatedAt: s.updatedAt,
    updatedByBranch: s.updatedByBranch,
    productMaster: s.productMaster,
    vehicleCatalog: s.vehicleCatalog,
  })
})

app.post('/api/v1/sync/push', auth, (req, res) => {
  const body = req.body ?? {}
  const branchId = typeof body.branchId === 'string' ? body.branchId.trim() : ''
  const baseRevision = Number(body.baseRevision)
  const productMaster = body.productMaster
  const vehicleCatalog = body.vehicleCatalog

  if (!branchId) {
    res.status(400).json({ ok: false, error: 'branchId required' })
    return
  }
  if (!Number.isFinite(baseRevision) || baseRevision < 0) {
    res.status(400).json({ ok: false, error: 'baseRevision invalid' })
    return
  }
  if (!Array.isArray(productMaster)) {
    res.status(400).json({ ok: false, error: 'productMaster must be array' })
    return
  }
  if (vehicleCatalog !== undefined && vehicleCatalog !== null && typeof vehicleCatalog !== 'object') {
    res.status(400).json({ ok: false, error: 'vehicleCatalog invalid' })
    return
  }

  const current = readState()
  if (baseRevision !== current.revision) {
    res.status(409).json({
      ok: false,
      error: 'revision_conflict',
      serverRevision: current.revision,
      updatedAt: current.updatedAt,
      updatedByBranch: current.updatedByBranch,
      productMaster: current.productMaster,
      vehicleCatalog: current.vehicleCatalog,
    })
    return
  }

  const nextRevision = current.revision + 1
  const next = {
    revision: nextRevision,
    updatedAt: new Date().toISOString(),
    updatedByBranch: branchId,
    productMaster,
    vehicleCatalog: vehicleCatalog ?? null,
  }
  writeStateAtomic(next)

  res.json({
    ok: true,
    revision: nextRevision,
    updatedAt: next.updatedAt,
    updatedByBranch: branchId,
  })
})

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'not_found' })
})

ensureDataDir()
app.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[bento-hub] listening http://0.0.0.0:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`[bento-hub] data: ${DATA_DIR}`)
  // eslint-disable-next-line no-console
  console.log(`[bento-hub] token: (set BENTO_HUB_TOKEN to override) default dev token`)
})
