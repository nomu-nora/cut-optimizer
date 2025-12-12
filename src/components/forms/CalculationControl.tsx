import { Card, Button } from '@/components/ui'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'
import type { OffcutMode } from '@/types'

interface CalculationControlProps {
  optimizationGoal: OptimizationGoal
  onOptimizationGoalChange: (goal: OptimizationGoal) => void
  useGA: boolean
  onUseGAChange: (useGA: boolean) => void
  useGridGrouping: boolean
  onUseGridGroupingChange: (useGridGrouping: boolean) => void
  offcutMode: OffcutMode
  onOffcutModeChange: (mode: OffcutMode) => void
  hasOffcuts: boolean
  onCalculate: () => void
  isCalculating: boolean
  disabled?: boolean
}

export function CalculationControl({
  optimizationGoal,
  onOptimizationGoalChange,
  useGA,
  onUseGAChange,
  useGridGrouping,
  onUseGridGroupingChange,
  offcutMode,
  onOffcutModeChange,
  hasOffcuts,
  onCalculate,
  isCalculating,
  disabled = false,
}: CalculationControlProps) {
  return (
    <Card title="計算実行">
      <div className="space-y-4">
        {/* Optimization Goal & Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Optimization Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最適化目標</label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="optimizationGoal"
                  value="yield"
                  checked={optimizationGoal === 'yield'}
                  onChange={(e) => onOptimizationGoalChange(e.target.value as OptimizationGoal)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">歩留まり優先</span>
                  <p className="text-xs text-gray-500">材料の無駄を最小化</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="optimizationGoal"
                  value="remaining-space"
                  checked={optimizationGoal === 'remaining-space'}
                  onChange={(e) => onOptimizationGoalChange(e.target.value as OptimizationGoal)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">余りスペース優先</span>
                  <p className="text-xs text-gray-500">次回使いやすい形状の余りを確保</p>
                </div>
              </label>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">オプション</label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGridGrouping}
                  onChange={(e) => onUseGridGroupingChange(e.target.checked)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">グリッド配置</span>
                  <p className="text-xs text-gray-500">同じサイズの製品を格子状にまとめて配置</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGA}
                  onChange={(e) => onUseGAChange(e.target.checked)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">遺伝的アルゴリズム（GA）</span>
                  <p className="text-xs text-gray-500">
                    より広い解空間を探索（計算時間: 約10-20秒）
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Offcut Mode (only show when offcuts are registered) */}
        {hasOffcuts && (
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">端材処理モード</label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="offcutMode"
                  value="consumption"
                  checked={offcutMode === 'consumption'}
                  onChange={(e) => onOffcutModeChange(e.target.value as OffcutMode)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">端材消費モード</span>
                  <p className="text-xs text-gray-500">
                    端材ごとに最高歩留まりの製品を選択（端材を優先的に消費）
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="offcutMode"
                  value="optimization"
                  checked={offcutMode === 'optimization'}
                  onChange={(e) => onOffcutModeChange(e.target.value as OffcutMode)}
                  className="mt-0.5 mr-2"
                />
                <div className="flex-1">
                  <span className="font-medium">全体最適モード</span>
                  <p className="text-xs text-gray-500">
                    全体の平均歩留まりを最大化（端材は必要に応じて使用）
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <div className="pt-2">
          <Button
            onClick={onCalculate}
            disabled={disabled || isCalculating}
            fullWidth
            variant="primary"
            size="lg"
          >
            {isCalculating ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                計算中...
              </span>
            ) : (
              '計算実行'
            )}
          </Button>
        </div>

        {/* Hint */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          💡 ヒント: 複数の設定で計算して、結果を比較検討できます
        </div>
      </div>
    </Card>
  )
}
