import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

function getDbUrl(): string {
  return process.env.DATABASE_URL ?? 'postgresql://postgres:1234@localhost:5432/bento?schema=public'
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function handleStaffUsersLoad(res: ServerResponse) {
  const { default: postgres } = await import('postgres')
  const sql = postgres(getDbUrl(), { max: 1, idle_timeout: 5 })
  try {
    const rows = await sql<{ payload: unknown }[]>`
      SELECT payload FROM "StaffUserRow"
      ORDER BY COALESCE(payload->>'username', '')
    `
    sendJson(res, rows.map((r) => r.payload))
  } finally {
    await sql.end()
  }
}

async function handleStaffUsersReplace(req: IncomingMessage, res: ServerResponse) {
  const body = await new Promise<string>((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
  const rows = JSON.parse(body) as unknown[]
  const { default: postgres } = await import('postgres')
  const sql = postgres(getDbUrl(), { max: 1, idle_timeout: 5 })
  try {
    await sql.begin(async (tx) => {
      await tx`DELETE FROM "StaffUserRow"`
      for (const row of rows) {
        const r = row as Record<string, unknown>
        const id = String(r.id ?? '')
        await tx`
          INSERT INTO "StaffUserRow" (id, payload, "updatedAt")
          VALUES (${id}, ${tx.json(r)}, (now() AT TIME ZONE 'Asia/Bangkok'))
          ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, "updatedAt" = EXCLUDED."updatedAt"
        `
      }
    })
    sendJson(res, { ok: true })
  } finally {
    await sql.end()
  }
}

export function devApiPlugin(): Plugin {
  return {
    name: 'bento-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? ''
        try {
          if (url === '/api/staff-users' && req.method === 'GET') {
            await handleStaffUsersLoad(res)
            return
          }
          if (url === '/api/staff-users' && req.method === 'POST') {
            await handleStaffUsersReplace(req, res)
            return
          }
        } catch (e) {
          console.error('[dev-api]', e)
          sendJson(res, { error: String(e) }, 500)
          return
        }
        next()
      })
    },
  }
}
