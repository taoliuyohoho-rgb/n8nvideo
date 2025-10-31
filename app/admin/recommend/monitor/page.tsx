'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type Snapshot = {
  totals: { requests: number; success: number; errors: number; cacheHit: number; fallback: number }
  latency: { p50: number; p90: number; p95: number; p99: number }
}

type MetricsResponse = { success: boolean; data: { snapshot: Snapshot; alert: { type: string; detail: any } } }
type AlertResponse = { success: boolean; data: { snapshot: Snapshot; alert: { type: string; detail: any }; last: any } }

function formatMs(v: number) { return `${Math.round(v)}ms` }

export default function RecommendMonitorPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [alert, setAlert] = useState<{ type: string; detail: any } | null>(null)
  const [history, setHistory] = useState<Array<{ t: number; p50: number; p95: number; fallbackRate: number }>>([])
  const [breakdown, setBreakdown] = useState<Array<{ scenario: string; requests: number; success: number; errors: number; cacheHit: number; fallback: number; p50: number; p95: number }>>([])
  const timerRef = useRef<any>(null)

  const fallbackRate = useMemo(() => {
    if (!snapshot) return 0
    const total = Math.max(1, snapshot.totals.requests)
    return snapshot.totals.fallback / total
  }, [snapshot])

  const danger = fallbackRate > 0.05 || (snapshot?.latency.p95 ?? 0) > 300

  useEffect(() => {
    const fetchOnce = async () => {
      try {
        const res = await fetch('/api/recommend/metrics', { cache: 'no-store' })
        const json = await res.json() as any
        if (json?.success) {
          setSnapshot(json.data.snapshot)
          setAlert(json.data.alert)
          setBreakdown(json.data.breakdown || [])
          const s = json.data.snapshot
          setHistory(prev => {
            const next = [...prev, { t: Date.now(), p50: s.latency.p50, p95: s.latency.p95, fallbackRate: Math.round((s.totals.fallback / Math.max(1, s.totals.requests))*10000)/100 }]
            return next.slice(-60)
          })
        }
      } catch {}
    }
    fetchOnce()
    timerRef.current = setInterval(fetchOnce, 5000)
    return () => clearInterval(timerRef.current)
  }, [])

  const latest = snapshot

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">推荐引擎监控</h2>
        <div className="flex items-center gap-2">
          {danger ? (
            <Badge variant="destructive">红线告警</Badge>
          ) : (
            <Badge variant="default">正常</Badge>
          )}
          <Button size="sm" onClick={() => window.location.reload()}>手动刷新</Button>
          <a href="/api/recommend/metrics?format=csv" download>
            <Button size="sm" variant="outline" type="button">导出CSV</Button>
          </a>
        </div>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">请求总数</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{latest?.totals.requests ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">成功/错误</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{latest?.totals.success ?? 0} / {latest?.totals.errors ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">缓存命中</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{latest?.totals.cacheHit ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fallback 比例</CardTitle></CardHeader>
          <CardContent className={`text-2xl font-bold ${fallbackRate>0.05?'text-red-600':''}`}>{(fallbackRate*100).toFixed(2)}%</CardContent>
        </Card>
      </div>

      {/* 延迟与Fallback趋势 */}
      <Card>
        <CardHeader><CardTitle>延迟与Fallback趋势（最近5分钟）</CardTitle></CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map(d => ({
              time: new Date(d.t).toLocaleTimeString(), p50: d.p50, p95: d.p95, fallback: d.fallbackRate
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" interval={Math.max(0, Math.floor(history.length/6)-1)} />
              <YAxis yAxisId="ms" domain={[0, 'auto']} tickFormatter={formatMs} />
              <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickFormatter={v=>`${v}%`} />
              <Tooltip formatter={(v:any, n:any)=> n==='fallback'?`${v}%`:formatMs(v)} />
              <Legend />
              <Line yAxisId="ms" type="monotone" dataKey="p50" stroke="#0ea5e9" name="p50(ms)" dot={false} />
              <Line yAxisId="ms" type="monotone" dataKey="p95" stroke="#10b981" name="p95(ms)" dot={false} />
              <Line yAxisId="pct" type="monotone" dataKey="fallback" stroke="#ef4444" name="fallback(%)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 当前红线状态 */}
      <Card>
        <CardHeader><CardTitle>红线状态</CardTitle></CardHeader>
        <CardContent>
          {danger ? (
            <div className="text-sm text-red-700">⚠️ 已触发红线：{alert?.type==='fallback'?'Fallback 超过 5%':'p95 超过 300ms'}</div>
          ) : (
            <div className="text-sm text-green-700">✅ 未触发红线</div>
          )}
          {latest && (
            <div className="mt-2 text-xs text-gray-600">
              p50: {formatMs(latest.latency.p50)} · p95: {formatMs(latest.latency.p95)} · p99: {formatMs(latest.latency.p99)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 场景拆分 */}
      <Card>
        <CardHeader><CardTitle>场景拆分</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">场景</th>
                  <th className="py-2 pr-4">请求</th>
                  <th className="py-2 pr-4">成功</th>
                  <th className="py-2 pr-4">错误</th>
                  <th className="py-2 pr-4">命中</th>
                  <th className="py-2 pr-4">Fallback</th>
                  <th className="py-2 pr-4">Fallback%</th>
                  <th className="py-2 pr-4">p50</th>
                  <th className="py-2 pr-4">p95</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((r, idx) => (
                  <tr key={r.scenario+idx} className="border-t">
                    <td className="py-2 pr-4 font-medium">{r.scenario}</td>
                    <td className="py-2 pr-4">{r.requests}</td>
                    <td className="py-2 pr-4">{r.success}</td>
                    <td className="py-2 pr-4">{r.errors}</td>
                    <td className="py-2 pr-4">{r.cacheHit}</td>
                    <td className="py-2 pr-4">{r.fallback}</td>
                    <td className={`py-2 pr-4 ${ (r.fallback/Math.max(1,r.requests))>0.05?'text-red-600':'' }`}>{ ((r.fallback/Math.max(1,r.requests))*100).toFixed(2) }%</td>
                    <td className="py-2 pr-4">{formatMs(r.p50)}</td>
                    <td className="py-2 pr-4">{formatMs(r.p95)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


