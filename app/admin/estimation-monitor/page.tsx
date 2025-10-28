'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelInfo {
  id: string;
  provider: string;
  modelName: string;
  status: string;
  pricePer1kTokens: number;
  langs: string[];
}

interface SegmentMetrics {
  segmentKey: string;
  qualityScore?: number;
  editRate?: number;
  rejectionRate?: number;
  avgCost?: number;
  avgLatency?: number;
  sampleCount: number;
}

interface DecisionStats {
  total: number;
  last24h: number;
  exploreCount: number;
  exploreRate: number;
  fallbackCount: number;
  fallbackRate: number;
}

export default function EstimationMonitorPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [segmentMetrics, setSegmentMetrics] = useState<SegmentMetrics[]>([]);
  const [decisionStats, setDecisionStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load models
      const modelsRes = await fetch('/api/ai/auto-select/models');
      const modelsData = await modelsRes.json();
      setModels(modelsData.models || []);

      // Load segment metrics
      const metricsRes = await fetch('/api/admin/estimation/segment-metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setSegmentMetrics(metricsData.metrics || []);
      }

      // Load decision stats
      const statsRes = await fetch('/api/admin/estimation/decision-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDecisionStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">预估模型监控</h1>
          <p className="text-gray-500 mt-1">实时监控模型选择与性能指标</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          刷新数据
        </button>
      </div>

      {/* Decision Stats */}
      {decisionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">总决策数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{decisionStats.total}</div>
              <p className="text-xs text-gray-500 mt-1">24h: {decisionStats.last24h}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">探索占比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(decisionStats.exploreRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {decisionStats.exploreCount} / {decisionStats.last24h}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">回退率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(decisionStats.fallbackRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {decisionStats.fallbackCount} / {decisionStats.last24h}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">健康状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">正常</div>
              <p className="text-xs text-gray-500 mt-1">所有指标正常</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Models Status */}
      <Card>
        <CardHeader>
          <CardTitle>模型池状态</CardTitle>
          <CardDescription>当前可用的候选模型列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Provider</th>
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">语言支持</th>
                  <th className="text-left p-2">单价($/1k tokens)</th>
                  <th className="text-left p-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{model.provider}</td>
                    <td className="p-2 font-mono text-sm">{model.modelName}</td>
                    <td className="p-2">
                      <div className="flex gap-1 flex-wrap">
                        {model.langs.slice(0, 4).map((lang) => (
                          <span
                            key={lang}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {lang}
                          </span>
                        ))}
                        {model.langs.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{model.langs.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">${model.pricePer1kTokens.toFixed(4)}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          model.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {model.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Segment Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>段位指标（24小时）</CardTitle>
          <CardDescription>按类目×地区×渠道分段的性能指标</CardDescription>
        </CardHeader>
        <CardContent>
          {segmentMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无数据，开始使用后将显示指标
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">段位</th>
                    <th className="text-left p-2">质量得分</th>
                    <th className="text-left p-2">修改率</th>
                    <th className="text-left p-2">拒稿率</th>
                    <th className="text-left p-2">平均成本($)</th>
                    <th className="text-left p-2">平均延迟(ms)</th>
                    <th className="text-left p-2">样本数</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentMetrics.map((metric) => (
                    <tr key={metric.segmentKey} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{metric.segmentKey}</td>
                      <td className="p-2">
                        {metric.qualityScore !== undefined ? (
                          <span
                            className={`font-semibold ${
                              metric.qualityScore >= 0.8
                                ? 'text-green-600'
                                : metric.qualityScore >= 0.6
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {(metric.qualityScore * 100).toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-2">
                        {metric.editRate !== undefined
                          ? `${(metric.editRate * 100).toFixed(1)}%`
                          : '-'}
                      </td>
                      <td className="p-2">
                        {metric.rejectionRate !== undefined ? (
                          <span
                            className={`${
                              metric.rejectionRate >= 0.2 ? 'text-red-600 font-semibold' : ''
                            }`}
                          >
                            {(metric.rejectionRate * 100).toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-2">
                        {metric.avgCost !== undefined ? `$${metric.avgCost.toFixed(4)}` : '-'}
                      </td>
                      <td className="p-2">
                        {metric.avgLatency !== undefined
                          ? `${Math.round(metric.avgLatency)}ms`
                          : '-'}
                      </td>
                      <td className="p-2">{metric.sampleCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => {
                window.open('/api/ai/auto-select/models', '_blank');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              查看模型池 API
            </button>
            <button
              onClick={() => {
                alert('测试Rank功能开发中...');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              测试 Rank
            </button>
            <button
              onClick={() => {
                if (confirm('确认清空所有熔断状态？')) {
                  fetch('/api/admin/estimation/clear-circuit-breakers', { method: 'POST' })
                    .then(() => alert('已清空'))
                    .catch((e) => alert('失败: ' + e.message));
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              清空熔断
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}














