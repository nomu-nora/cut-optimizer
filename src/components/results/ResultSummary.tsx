import { Card } from '@/components/ui'
import type { CalculationResult } from '@/types'

export interface ResultSummaryProps {
  result: CalculationResult
  registeredOffcutCount: number
  totalItemQuantity: number
}

export function ResultSummary({
  result,
  registeredOffcutCount,
  totalItemQuantity,
}: ResultSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(value)
  }

  // 元板のみの枚数を計算
  const newPlateCount = (result.patterns || [])
    .filter((p) => !p.isOffcut)
    .reduce((sum, p) => sum + p.count, 0)

  // 元板から切り出す製品数を計算
  const itemsFromNewPlates = (result.patterns || [])
    .filter((p) => !p.isOffcut)
    .reduce((sum, p) => sum + p.placements.length * p.count, 0)

  // 端材使用情報
  const offcutUsage = result.offcutUsage
  const usedOffcutCount = offcutUsage?.used.length || 0
  const totalItemsFromOffcuts = offcutUsage?.totalItemsOnOffcuts || 0

  // 歩留まり計算
  // 1. 全体の歩留まり（result.averageYieldに含まれている）
  const overallYield = result.averageYield

  // 2. 元板だけの歩留まり
  const newPlatePatterns = (result.patterns || []).filter((p) => !p.isOffcut)
  const newPlateYield =
    newPlatePatterns.length > 0
      ? newPlatePatterns.reduce((sum, p) => sum + p.yield * p.count, 0) /
        newPlatePatterns.reduce((sum, p) => sum + p.count, 0)
      : 0

  // 3. 端材の歩留まり（使用した端材のみ）
  const offcutPatterns = (result.patterns || []).filter((p) => p.isOffcut)
  const offcutYield =
    offcutPatterns.length > 0
      ? offcutPatterns.reduce((sum, p) => sum + p.yield * p.count, 0) /
        offcutPatterns.reduce((sum, p) => sum + p.count, 0)
      : 0

  return (
    <Card title="計算結果サマリー">
      <div className="space-y-6">
        {/* 元板情報 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">元板</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">必要枚数</p>
              <p className="text-3xl font-bold text-blue-900">{newPlateCount}</p>
              <p className="text-xs text-blue-600 mt-1">枚</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium mb-1">合計コスト</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(result.totalCost)}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium mb-1">切り出す製品</p>
              <p className="text-3xl font-bold text-green-900">
                {itemsFromNewPlates} / {totalItemQuantity}
              </p>
              <p className="text-xs text-green-600 mt-1">個</p>
            </div>
          </div>
        </div>

        {/* 端材情報 */}
        {offcutUsage && (
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">端材</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-600 font-medium mb-1">使用状況</p>
                <p className="text-3xl font-bold text-amber-900">
                  {usedOffcutCount} / {registeredOffcutCount}
                </p>
                <p className="text-xs text-amber-600 mt-1">枚使用</p>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-600 font-medium mb-1">切り出す製品</p>
                <p className="text-3xl font-bold text-teal-900">
                  {totalItemsFromOffcuts} / {totalItemQuantity}
                </p>
                <p className="text-xs text-teal-600 mt-1">個</p>
              </div>
            </div>
          </div>
        )}

        {/* 歩留まり情報 */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">歩留まり</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-600 font-medium mb-1">全体</p>
              <p className="text-3xl font-bold text-indigo-900">{overallYield.toFixed(1)}</p>
              <p className="text-xs text-indigo-600 mt-1">%</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium mb-1">元板のみ</p>
              <p className="text-3xl font-bold text-blue-900">{newPlateYield.toFixed(1)}</p>
              <p className="text-xs text-blue-600 mt-1">%</p>
            </div>

            {offcutUsage && offcutPatterns.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-600 font-medium mb-1">端材のみ（使用分）</p>
                <p className="text-3xl font-bold text-amber-900">{offcutYield.toFixed(1)}</p>
                <p className="text-xs text-amber-600 mt-1">%</p>
              </div>
            )}
          </div>

          {/* 歩留まり詳細（v1.5 - 最適化分析） */}
          {result.yieldExcludingLast !== undefined && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                歩留まり詳細（最適化分析）
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 最後を除く平均 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-600 font-medium mb-1">最後を除く平均</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-emerald-900">
                      {result.yieldExcludingLast.toFixed(1)}
                    </p>
                    {result.meetsYieldTarget && (
                      <span className="text-emerald-600 text-sm font-medium">✓ 目標達成</span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    % (目標: {result.targetYield || 85}%以上)
                  </p>
                </div>

                {/* 最後のパターン */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600 font-medium mb-1">最後のパターン</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {result.lastPatternYield?.toFixed(1) || '—'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">% (調整用)</p>
                </div>

                {/* 最適化状態 */}
                <div
                  className={`rounded-lg p-4 border ${
                    result.meetsYieldTarget
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium mb-1 ${
                      result.meetsYieldTarget ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    最適化状態
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      result.meetsYieldTarget ? 'text-green-900' : 'text-yellow-900'
                    }`}
                  >
                    {result.meetsYieldTarget ? '最適' : '改善可能'}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      result.meetsYieldTarget ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {result.meetsYieldTarget ? '高効率配置' : '調整を検討'}
                  </p>
                </div>
              </div>

              {/* 説明テキスト */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>最後を除く平均:</strong>{' '}
                  最後のパターン以外の歩留まり平均値。85%以上が推奨されます。
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>最後のパターン:</strong>{' '}
                  調整用パターンの歩留まり。低くても問題ありません（端材として再利用可能）。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
