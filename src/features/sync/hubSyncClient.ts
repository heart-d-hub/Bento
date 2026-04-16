import type { ProductMasterDetail } from '@/features/inventory/data/productMasterData'
import type { VehicleCatalogState } from '@/features/vehicle/data/types'
import type { HubConflict, HubPullOk, HubPushOk } from '@/features/sync/hubSyncTypes'

function trimBase(url: string): string {
  return url.replace(/\/+$/, '')
}

export async function hubHealthCheck(baseUrl: string): Promise<{ ok: boolean; revision?: number; error?: string }> {
  const u = `${trimBase(baseUrl)}/health`
  try {
    const res = await fetch(u, { method: 'GET' })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const j = (await res.json()) as { ok?: boolean; revision?: number }
    return { ok: Boolean(j.ok), revision: typeof j.revision === 'number' ? j.revision : undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}

export async function hubPull(
  baseUrl: string,
  token: string,
): Promise<{ ok: true; data: HubPullOk } | { ok: false; error: string; status?: number }> {
  const u = `${trimBase(baseUrl)}/api/v1/sync/pull?token=${encodeURIComponent(token)}`
  try {
    const res = await fetch(u, { method: 'GET' })
    const j = (await res.json()) as HubPullOk & { ok?: boolean; error?: string }
    if (!res.ok) return { ok: false, error: j.error ?? `HTTP ${res.status}`, status: res.status }
    if (!j.ok) return { ok: false, error: j.error ?? 'pull failed' }
    return { ok: true, data: j as HubPullOk }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}

export async function hubPush(
  baseUrl: string,
  token: string,
  body: {
    branchId: string
    baseRevision: number
    productMaster: ProductMasterDetail[]
    vehicleCatalog: VehicleCatalogState | null
  },
): Promise<
  | { ok: true; data: HubPushOk }
  | { ok: false; conflict: HubConflict }
  | { ok: false; error: string; status?: number }
> {
  const u = `${trimBase(baseUrl)}/api/v1/sync/push?token=${encodeURIComponent(token)}`
  try {
    const res = await fetch(u, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = (await res.json()) as Record<string, unknown>
    if (res.status === 409) {
      const c = j as HubConflict & { ok?: boolean }
      return {
        ok: false,
        conflict: {
          ok: false,
          status: 409,
          serverRevision: Number(c.serverRevision) || 0,
          updatedAt: (c.updatedAt as string) ?? null,
          updatedByBranch: (c.updatedByBranch as string) ?? null,
          productMaster: Array.isArray(c.productMaster) ? (c.productMaster as ProductMasterDetail[]) : [],
          vehicleCatalog: (c.vehicleCatalog as VehicleCatalogState) ?? null,
        },
      }
    }
    if (!res.ok) {
      return { ok: false, error: String(j.error ?? `HTTP ${res.status}`), status: res.status }
    }
    if (!j.ok) return { ok: false, error: String(j.error ?? 'push failed') }
    return { ok: true, data: j as HubPushOk }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}
