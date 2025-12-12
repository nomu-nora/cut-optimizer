import { Card } from '@/components/ui'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'

interface OptimizationGoalFormProps {
  value: OptimizationGoal
  onChange: (goal: OptimizationGoal) => void
  useGA: boolean
  onUseGAChange: (useGA: boolean) => void
  useGridGrouping: boolean
  onUseGridGroupingChange: (useGridGrouping: boolean) => void
}

export function OptimizationGoalForm({
  value,
  onChange,
  useGA,
  onUseGAChange,
  useGridGrouping,
  onUseGridGroupingChange,
}: OptimizationGoalFormProps) {
  return (
    <Card title="最適化目標">
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="optimizationGoal"
              value="yield"
              checked={value === 'yield'}
              onChange={(e) => onChange(e.target.value as OptimizationGoal)}
              className="mr-2"
            />
            <div>
              <span className="font-medium">歩留まり優先</span>
              <p className="text-sm text-gray-600">材料の無駄を最小化</p>
            </div>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="optimizationGoal"
              value="remaining-space"
              checked={value === 'remaining-space'}
              onChange={(e) => onChange(e.target.value as OptimizationGoal)}
              className="mr-2"
            />
            <div>
              <span className="font-medium">余りスペース優先</span>
              <p className="text-sm text-gray-600">
                次回使いやすい形状の余りを確保（左下詰め配置）
              </p>
            </div>
          </label>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          💡 ヒント: 余りスペース優先は、余った材料を次回の作業で活用しやすくします。
        </div>

        <div className="border-t pt-3 mt-3">
          <label className="flex items-center cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={useGridGrouping}
              onChange={(e) => onUseGridGroupingChange(e.target.checked)}
              className="mr-2"
            />
            <div>
              <span className="font-medium">グリッド配置を使用</span>
              <p className="text-sm text-gray-600">
                同じサイズの製品を格子状にまとめて配置します（切断しやすい配置）
              </p>
            </div>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useGA}
              onChange={(e) => onUseGAChange(e.target.checked)}
              className="mr-2"
            />
            <div>
              <span className="font-medium">遺伝的アルゴリズム（GA）を使用</span>
              <p className="text-sm text-gray-600">
                より広い解空間を探索して最適解を見つけます（計算時間: 約10-20秒）
              </p>
            </div>
          </label>
        </div>
      </div>
    </Card>
  )
}
