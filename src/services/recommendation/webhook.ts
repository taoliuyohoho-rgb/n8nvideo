export async function sendAlertWebhook(payload: any) {
  const url = process.env.RECO_ALERT_WEBHOOK
  if (!url) return
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } catch (e) {
    console.error('[reco.webhook] send failed', e)
  }
}


