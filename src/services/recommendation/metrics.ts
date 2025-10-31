// Minimal in-memory metrics aggregator with simple alerting hooks.

type Counter = { count: number };
type Histogram = { samples: number[] };

const counters: Record<string, Counter> = Object.create(null);
const histograms: Record<string, Histogram> = Object.create(null);
const scenarioHists: Record<string, Histogram> = Object.create(null);

function c(name: string): Counter {
  if (!counters[name]) counters[name] = { count: 0 };
  return counters[name];
}

function h(name: string): Histogram {
  if (!histograms[name]) histograms[name] = { samples: [] };
  return histograms[name];
}

function hs(scenario: string): Histogram {
  if (!scenarioHists[scenario]) scenarioHists[scenario] = { samples: [] };
  return scenarioHists[scenario];
}

export function recordRequest(opts: {
  scenario: string;
  durationMs: number;
  success: boolean;
  fromCache: boolean;
  fallback: boolean;
}) {
  c(`reco.requests.total`).count++;
  c(`reco.requests.${opts.scenario}.total`).count++;
  if (opts.success) c(`reco.success.total`).count++;
  else c(`reco.errors.total`).count++;
  if (opts.success) c(`reco.success.${opts.scenario}`).count++;
  else c(`reco.errors.${opts.scenario}`).count++;
  if (opts.fromCache) c(`reco.cache_hit.total`).count++;
  if (opts.fromCache) c(`reco.cache_hit.${opts.scenario}`).count++;
  if (opts.fallback) c(`reco.fallback.total`).count++;
  if (opts.fallback) c(`reco.fallback.${opts.scenario}`).count++;
  h(`reco.latency`).samples.push(opts.durationMs);
  hs(opts.scenario).samples.push(opts.durationMs);
}

export function getSnapshot() {
  const p = (name: string) => counters[name]?.count || 0;
  const lat = h('reco.latency').samples.slice(-5000).sort((a, b) => a - b);
  const pick = (q: number) => lat.length ? lat[Math.floor(q * (lat.length - 1))] : 0;
  return {
    totals: {
      requests: p('reco.requests.total'),
      success: p('reco.success.total'),
      errors: p('reco.errors.total'),
      cacheHit: p('reco.cache_hit.total'),
      fallback: p('reco.fallback.total'),
    },
    latency: {
      p50: pick(0.50), p90: pick(0.90), p95: pick(0.95), p99: pick(0.99)
    }
  };
}

export function shouldAlert(): { type: 'fallback' | 'latency' | 'ok'; detail: any } {
  const s = getSnapshot();
  const total = Math.max(1, s.totals.requests);
  const fallbackRate = s.totals.fallback / total;
  if (fallbackRate > 0.05) return { type: 'fallback', detail: { fallbackRate } };
  if (s.latency.p95 > 300) return { type: 'latency', detail: { p95: s.latency.p95 } };
  return { type: 'ok', detail: null };
}

export function getScenarioBreakdown() {
  // derive scenarios from counters keys
  const scenarios = new Set<string>();
  Object.keys(counters).forEach(k => {
    const m = k.match(/^reco\.requests\.(.*)\.total$/);
    if (m) scenarios.add(m[1]);
  });
  const rows: Array<{ scenario: string; requests: number; success: number; errors: number; cacheHit: number; fallback: number; p50: number; p95: number }>=[];
  for (const sc of scenarios) {
    const p = (name: string) => counters[name]?.count || 0;
    const lat = (scenarioHists[sc]?.samples || []).slice(-2000).sort((a,b)=>a-b);
    const pick = (q:number)=> lat.length? lat[Math.floor(q*(lat.length-1))]:0;
    rows.push({
      scenario: sc,
      requests: p(`reco.requests.${sc}.total`),
      success: p(`reco.success.${sc}`),
      errors: p(`reco.errors.${sc}`),
      cacheHit: p(`reco.cache_hit.${sc}`),
      fallback: p(`reco.fallback.${sc}`),
      p50: pick(0.50),
      p95: pick(0.95),
    })
  }
  return rows.sort((a,b)=> b.requests - a.requests)
}

export function toCSV() {
  const rows = getScenarioBreakdown()
  const header = ['scenario','requests','success','errors','cacheHit','fallback','fallbackRate','p50_ms','p95_ms']
  const lines = [header.join(',')]
  for (const r of rows) {
    const rate = (r.fallback/Math.max(1,r.requests))*100
    lines.push([r.scenario,r.requests,r.success,r.errors,r.cacheHit,r.fallback,rate.toFixed(2),Math.round(r.p50),Math.round(r.p95)].join(','))
  }
  return lines.join('\n')
}


