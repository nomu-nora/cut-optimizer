import { Card } from '@/components/ui'

export interface ResultSummaryProps {
  totalPlates: number
  averageYield: number
  totalCost: number
}

export function ResultSummary({
  totalPlates,
  averageYield,
  totalCost,
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
    </Card>
  )
}
