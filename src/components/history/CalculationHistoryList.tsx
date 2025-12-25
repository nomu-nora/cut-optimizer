'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, ErrorMessage, Spinner } from '@/components/ui'
import {
  getCalculationHistory,
  deleteCalculationHistory,
  toggleCalculationStar,
  type CalculationHistory,
} from '@/lib/database/history'
import type { PlateConfig, CutConfig, Item, OffcutPlate, OffcutMode } from '@/types'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'

export interface CalculationHistoryListProps {
  onRestore: (data: {
    plateConfig: PlateConfig
    cutConfig: CutConfig
    items: Item[]
    offcuts: OffcutPlate[]
    optimizationGoal: OptimizationGoal
    useGA: boolean
    useGridGrouping: boolean
    offcutMode: OffcutMode
  }) => void
}

export function CalculationHistoryList({ onRestore }: CalculationHistoryListProps) {
  const { user } = useAuth()
  const [history, setHistory] = useState<CalculationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('📥 Loading calculation history for user:', user.id)
      const data = await getCalculationHistory(user.id, 100)
      console.log('✅ Calculation history loaded:', data.length, 'entries')
      setHistory(data)
      setError(null)
    } catch (err) {
      console.error('❌ Failed to load history:', err)
      setError(err instanceof Error ? err.message : '履歴の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [user])

  const handleRestore = (calculation: CalculationHistory) => {
    onRestore({
      plateConfig: calculation.plate_config,
      cutConfig: calculation.cut_config,
      items: calculation.products,
      offcuts: calculation.offcuts,
      optimizationGoal: calculation.optimization_goal,
      useGA: calculation.use_ga,
      useGridGrouping: calculation.use_grid_grouping,
      offcutMode: calculation.offcut_mode,
    })
  }

  const handleDelete = async (calculationId: string) => {
    if (!confirm('この計算履歴を削除しますか？')) return

    try {
      setDeletingId(calculationId)
      await deleteCalculationHistory(calculationId)
      await loadHistory() // Reload list
    } catch (err) {
      console.error('Failed to delete calculation:', err)
      setError(err instanceof Error ? err.message : '履歴の削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleToggleStar = async (calculationId: string, currentStarred: boolean) => {
    try {
      await toggleCalculationStar(calculationId, !currentStarred)
      await loadHistory() // Reload to show updated star status
    } catch (err) {
      console.error('Failed to toggle star:', err)
      setError(err instanceof Error ? err.message : 'スターの切り替えに失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {error && <ErrorMessage message={error} />}

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">計算履歴はありません</p>
        ) : (
          history.map((calc) => (
            <div
              key={calc.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
            >
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(calc.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStar(calc.id, calc.is_starred)
                      }}
                      className="text-xl hover:scale-110 transition-transform"
                      title={calc.is_starred ? 'スターを外す' : 'スターを付ける'}
                    >
                      {calc.is_starred ? '⭐' : '☆'}
                    </button>
                    <h4 className="font-medium text-gray-900">
                      {calc.name || `計算結果 ${new Date(calc.created_at).toLocaleString('ja-JP')}`}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {expandedId === calc.id ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>元板: {calc.total_plates}枚</span>
                    <span>歩留まり: {calc.average_yield.toFixed(1)}%</span>
                    {calc.total_cost > 0 && (
                      <span>コスト: ¥{calc.total_cost.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(calc)}
                    disabled={deletingId === calc.id}
                  >
                    復元
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(calc.id)}
                    disabled={deletingId === calc.id}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {deletingId === calc.id ? '削除中...' : '削除'}
                  </Button>
                </div>
              </div>

              {expandedId === calc.id && (
                <div className="p-3 bg-white border-t border-gray-200 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-gray-700">元板サイズ:</span>{' '}
                      {calc.plate_config.width}×{calc.plate_config.height}mm
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">カット幅:</span>{' '}
                      {calc.cut_config.cutWidth}mm
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">製品数:</span>{' '}
                      {calc.products.length}種類
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">端材:</span> {calc.offcuts.length}
                      枚
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">最適化目標:</span>{' '}
                      {calc.optimization_goal === 'yield' ? '歩留まり優先' : '余白優先'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">端材モード:</span>{' '}
                      {calc.offcut_mode === 'consumption' ? '消費モード' : '最適化モード'}
                    </div>
                  </div>
                  {calc.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="font-medium text-gray-700">メモ:</span> {calc.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
