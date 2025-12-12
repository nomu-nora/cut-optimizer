'use client'

import type { OffcutMode } from '@/types'

export interface OffcutModeSelectorProps {
  mode: OffcutMode
  onChange: (mode: OffcutMode) => void
}

export function OffcutModeSelector({ mode, onChange }: OffcutModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">端材処理モード</label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="offcut-mode"
            value="consumption"
            checked={mode === 'consumption'}
            onChange={(e) => onChange(e.target.value as OffcutMode)}
            className="mr-2"
          />
          <div>
            <span className="font-medium">端材消費モード</span>
            <p className="text-xs text-gray-600">
              端材を優先的に使用し、各端材で最も歩留まりの高い配置を選択
            </p>
          </div>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="offcut-mode"
            value="optimization"
            checked={mode === 'optimization'}
            onChange={(e) => onChange(e.target.value as OffcutMode)}
            className="mr-2"
          />
          <div>
            <span className="font-medium">全体最適モード</span>
            <p className="text-xs text-gray-600">
              全体の平均歩留まりを最大化（端材は必要に応じて使用）
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
