import { NextResponse, NextRequest } from 'next/server'
import { getSnapshot, shouldAlert, getScenarioBreakdown, toCSV } from '@/src/services/recommendation/metrics'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('format') === 'csv') {
    const csv = toCSV()
    return new NextResponse(csv as any, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } })
  }
  const snapshot = getSnapshot()
  const alert = shouldAlert()
  const breakdown = getScenarioBreakdown()
  return NextResponse.json({ success: true, data: { snapshot, alert, breakdown } })
}


