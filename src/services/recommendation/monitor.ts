import { getSnapshot, shouldAlert } from './metrics'
import { sendAlertWebhook } from './webhook'

let started = false
let lastAlert: { type: 'fallback' | 'latency' | 'ok'; detail: any; at: number } = { type: 'ok', detail: null, at: Date.now() }

export function getLastAlert() {
  return lastAlert
}

export function startMonitor() {
  if (started) return
  started = true
  setInterval(async () => {
    try {
      const snapshot = getSnapshot()
      const alert = shouldAlert()
      if (alert.type !== 'ok') {
        lastAlert = { ...alert, at: Date.now() }
        // console error for now; webhook/email can be added later via env
        console.error(`[reco.alert] ${alert.type.toUpperCase()}`, { snapshot, alert })
        // send webhook
        try { await sendAlertWebhook({ type: alert.type, snapshot, alert, ts: Date.now() }) } catch {}
      }
    } catch (e) {
      console.error('[reco.monitor] error', e)
    }
  }, 60_000).unref?.()
}

try { startMonitor() } catch {}


