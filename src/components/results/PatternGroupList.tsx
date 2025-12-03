import { Card } from '@/components/ui'
import type { PatternGroup } from '@/types'

export interface PatternGroupListProps {
  patterns: PatternGroup[]
  onSelectPattern?: (pattern: PatternGroup) => void
  selectedPatternId?: string
}

export function PatternGroupList({
  patterns,
  onSelectPattern,
  selectedPatternId,
}: PatternGroupListProps) {
  if (patterns.length === 0) {
    return (
      <Card title="パターン一覧">
        <p className="text-gray-500 text-center py-8">
          計算結果がありません
        </p>
      </Card>
    )
  }

  return (
    <Card title="パターン一覧" noPadding>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                パターンID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                枚数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                製品数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                歩留まり
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patterns.map((pattern) => (
              <tr
                key={pattern.patternId}
                className={`hover:bg-gray-50 cursor-pointer ${
                  selectedPatternId === pattern.patternId ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectPattern?.(pattern)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold rounded">
                    {pattern.patternId}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pattern.count} 枚
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {pattern.placements.length} 個
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  <span className="font-medium">{pattern.yield.toFixed(1)}%</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPattern?.(pattern)
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    配置図を見る
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
