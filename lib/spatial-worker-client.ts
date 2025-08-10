"use client"

import { wrap, type Remote } from "comlink"
import type { SpatialAPI } from "@/workers/spatial-worker"
import { spatialFallback } from "@/lib/spatial-fallback"

type Instance =
  | { mode: "worker"; worker: Worker; remote: Remote<SpatialAPI> }
  | { mode: "fallback"; remote: SpatialAPI }

let _inst: Instance | null = null
let _warnedOnce = false

function warnOnce(message: string) {
  if (_warnedOnce) return
  _warnedOnce = true
  console.warn(message)
}

function toReadableError(e: any) {
  try {
    if (e?.message) return e.message
    if (e?.filename) return `Failed at ${e.filename}:${e.lineno || ""}:${e.colno || ""}`
    if (e?.type) return `Worker ${e.type}`
    return String(e)
  } catch {
    return "Unknown worker error"
  }
}

function setFallback(reason?: string) {
  try {
    if (_inst && _inst.mode === "worker") {
      _inst.worker.terminate()
    }
  } catch {}
  _inst = { mode: "fallback", remote: spatialFallback }
  if (reason) warnOnce(reason)
}

function supportsModuleWorkers(): boolean {
  try {
    const blob = new Blob(["export default null"], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    const w = new Worker(url, { type: "module" })
    w.terminate()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

function createBlobModuleWorker(moduleUrl: string): Worker {
  const code = `import "${moduleUrl}";`
  const blob = new Blob([code], { type: "application/javascript" })
  const url = URL.createObjectURL(blob)
  try {
    const worker = new Worker(url, { type: "module" })
    setTimeout(() => URL.revokeObjectURL(url), 0)
    return worker
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

async function healthCheck(remote: Remote<SpatialAPI>, ms = 1500): Promise<boolean> {
  try {
    const ok = await Promise.race([
      (remote as any).ping(),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), ms)),
    ])
    return ok === "ok"
  } catch {
    return false
  }
}

// Public API: returns a healthy spatial service (worker if OK, else fallback)
export async function getSpatialService(): Promise<{
  api: Remote<SpatialAPI> | SpatialAPI
  mode: "worker" | "fallback"
}> {
  if (_inst?.mode === "worker") {
    const ok = await healthCheck(_inst.remote)
    if (!ok) {
      setFallback("Spatial worker unresponsive; using inline fallback.")
    }
  }
  if (_inst) return { api: _inst.remote, mode: _inst.mode }

  // No instance yet: initialize
  if (!supportsModuleWorkers()) {
    setFallback("Module workers not supported; using inline fallback.")
    return { api: _inst!.remote, mode: "fallback" }
  }

  // Try direct module worker first
  try {
    const url = new URL("../workers/spatial-worker.ts", import.meta.url)
    const worker = new Worker(url, { type: "module" })
    const remote = wrap<SpatialAPI>(worker)
    const ok = await healthCheck(remote)
    if (!ok) {
      try {
        worker.terminate()
      } catch {}
      // Try Blob loader
      const alt = createBlobModuleWorker(url.toString())
      const altRemote = wrap<SpatialAPI>(alt)
      const ok2 = await healthCheck(altRemote)
      if (!ok2) {
        try {
          alt.terminate()
        } catch {}
        setFallback("Spatial worker could not be initialized; using inline fallback.")
      } else {
        _inst = { mode: "worker", worker: alt, remote: altRemote }
      }
    } else {
      _inst = { mode: "worker", worker, remote }
    }
  } catch (e) {
    // Try Blob loader directly
    try {
      const url = new URL("../workers/spatial-worker.ts", import.meta.url).toString()
      const worker = createBlobModuleWorker(url)
      const remote = wrap<SpatialAPI>(worker)
      const ok = await healthCheck(remote)
      if (!ok) {
        try {
          worker.terminate()
        } catch {}
        setFallback(`Failed to start spatial worker: ${toReadableError(e)}`)
      } else {
        _inst = { mode: "worker", worker, remote }
      }
    } catch (err) {
      setFallback(`Failed to start spatial worker: ${toReadableError(err)}`)
    }
  }

  return { api: _inst!.remote, mode: _inst!.mode }
}

export function resetSpatial() {
  if (_inst?.mode === "worker") {
    try {
      _inst.worker.terminate()
    } catch {}
  }
  _inst = null
  _warnedOnce = false
}

export { proxy } from "comlink"
