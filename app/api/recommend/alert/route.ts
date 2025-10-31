import { NextResponse } from 'next/server'
import { getSnapshot, shouldAlert } from '@/src/services/recommendation/metrics'
import { getLastAlert } from '@/src/services/recommendation/monitor'

export async function GET() {
  const snapshot = getSnapshot()
  const alert = shouldAlert()
  const last = getLastAlert()
  return NextResponse.json({ success: true, data: { snapshot, alert, last } })
}


