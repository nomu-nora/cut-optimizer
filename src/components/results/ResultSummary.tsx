import { Card } from '@/components/ui'
import type { OffcutUsage } from '@/types'

export interface ResultSummaryProps {
  totalPlates: number
  averageYield: number
  totalCost: number
  offcutUsage?: OffcutUsage
}

export function ResultSummary({
  totalPlates,
  averageYield,
  totalCost,
  offcutUsage,
}: ResultSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card title="計算結果サマリー">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">必要枚数</p>
          <p className="text-3xl font-bold text-blue-900">{totalPlates}</p>
          <p className="text-xs text-blue-600 mt-1">枚</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">平均歩留まり</p>
          <p className="text-3xl font-bold text-green-900">
            {averageYield.toFixed(1)}
          </p>
          <p className="text-xs text-green-600 mt-1">%</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium mb-1">合計コスト</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      {/* Offcut Usage Info */}
      {offcutUsage && offcutUsage.used.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">端材使用情報</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-600 font-medium mb-1">使用端材</p>
              <p className="text-3xl font-bold text-amber-900">{offcutUsage.used.length}</p>
              <p className="text-xs text-amber-600 mt-1">枚</p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm text-teal-600 font-medium mb-1">端材配置製品</p>
              <p className="text-3xl font-bold text-teal-900">{offcutUsage.totalItemsOnOffcuts}</p>
              <p className="text-xs text-teal-600 mt-1">個</p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-sm text-rose-600 font-medium mb-1">削減コスト</p>
              <p className="text-2xl font-bold text-rose-900">
                {formatCurrency(offcutUsage.costSaved)}
              </p>
            </div>
          </div>

          {offcutUsage.unused.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              ※ 未使用端材: {offcutUsage.unused.length}枚
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
