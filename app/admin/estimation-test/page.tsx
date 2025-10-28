'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EstimationTestPage() {
  const [loading, setLoading] = useState(false);
  const [rankResponse, setRankResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 测试用例
  const testCases = [
    {
      name: '基础测试（最小参数）',
      request: {
        task: {
          lang: 'ms',
          category: 'beauty',
        },
      },
    },
    {
      name: '完整测试（马来西亚美妆TikTok）',
      request: {
        task: {
          lang: 'ms',
          category: 'beauty',
          style: 'youthful',
          styleTags: ['playful', 'engaging'],
          lengthHint: 'short',
          priceTier: 'mid',
        },
        context: {
          region: 'MY',
          channel: 'tiktok',
          audience: 'genz',
        },
        options: {
          topK: 5,
          explore: true,
        },
      },
    },
    {
      name: '中文测试（中国服装）',
      request: {
        task: {
          lang: 'zh',
          category: 'fashion',
          style: 'luxury',
        },
        context: {
          region: 'CN',
          channel: 'douyin',
        },
        constraints: {
          maxCostUSD: 0.05,
        },
      },
    },
    {
      name: '低成本测试',
      request: {
        task: {
          lang: 'en',
          category: 'electronics',
        },
        constraints: {
          maxCostUSD: 0.001,
          maxLatencyMs: 5000,
        },
      },
    },
    {
      name: 'JSON模式测试',
      request: {
        task: {
          lang: 'en',
          category: 'beauty',
        },
        constraints: {
          requireJsonMode: true,
        },
      },
    },
  ];

  const runTest = async (testCase: any) => {
    setLoading(true);
    setError(null);
    setRankResponse(null);

    try {
      const response = await fetch('/api/ai/auto-select/rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.request),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(JSON.stringify(data, null, 2));
      } else {
        setRankResponse(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async () => {
    if (!rankResponse) return;

    try {
      const response = await fetch('/api/ai/auto-select/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionId: rankResponse.decisionId,
          qualityScore: 0.85,
          editDistance: 0.15,
          rejected: false,
          conversion: true,
          latencyMs: 3500,
          costActual: 0.025,
          tokensInput: 1000,
          tokensOutput: 500,
          autoEval: {
            structuredRate: 0.95,
            toxicityFlag: false,
            styleConsistency: 0.88,
          },
          feedbackSource: 'auto',
        }),
      });

      const data = await response.json();
      alert('Feedback sent: ' + JSON.stringify(data, null, 2));
    } catch (err: any) {
      alert('Feedback error: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">预估模型测试</h1>
        <p className="text-gray-500 mt-1">测试 Rank API 与 Feedback API</p>
      </div>

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>测试用例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testCases.map((testCase, index) => (
              <button
                key={index}
                onClick={() => runTest(testCase)}
                disabled={loading}
                className="p-4 border rounded hover:bg-gray-50 text-left disabled:opacity-50"
              >
                <div className="font-semibold">{testCase.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {testCase.request.task.lang} / {testCase.request.task.category}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">正在调用 Rank API...</div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">错误</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">{error}</pre>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {rankResponse && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Rank 响应</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Key Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Decision ID</div>
                    <div className="font-mono text-sm">{rankResponse.decisionId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Strategy Version</div>
                    <div>{rankResponse.strategyVersion}</div>
                  </div>
                </div>

                {/* Chosen Model */}
                <div className="border rounded p-4 bg-green-50">
                  <div className="font-semibold mb-2">✓ 选中模型</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Provider:</span>{' '}
                      <span className="font-semibold">{rankResponse.chosen.provider}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Model:</span>{' '}
                      <span className="font-mono text-xs">{rankResponse.chosen.modelName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Score:</span>{' '}
                      <span className="font-semibold">
                        {rankResponse.chosen.fineScore?.toFixed(3) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span> $
                      {rankResponse.chosen.expectedCost?.toFixed(4) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Candidates */}
                <div>
                  <div className="font-semibold mb-2">候选列表</div>
                  <div className="space-y-2">
                    {rankResponse.candidates.map((candidate: any, idx: number) => (
                      <div key={idx} className="border rounded p-3 text-sm">
                        <div className="flex justify-between">
                          <span>
                            {candidate.provider} / {candidate.modelName}
                          </span>
                          <span className="font-mono">
                            Score: {candidate.fineScore?.toFixed(3) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timings */}
                {rankResponse.timings && (
                  <div className="text-sm text-gray-600">
                    ⏱️ 耗时: Coarse {rankResponse.timings.coarseMs}ms | Fine{' '}
                    {rankResponse.timings.fineMs}ms | Total {rankResponse.timings.totalMs}ms
                  </div>
                )}

                {/* Full JSON */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">查看完整响应</summary>
                  <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto mt-2">
                    {JSON.stringify(rankResponse, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>

          {/* Send Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>发送反馈</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={sendFeedback}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                发送模拟反馈（质量0.85, 成本$0.025）
              </button>
              <p className="text-sm text-gray-500 mt-2">
                将为此决策发送模拟的质量、成本、延迟等反馈数据
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}














