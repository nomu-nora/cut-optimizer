'use client'

import { Button, Card } from '@/components/ui'
import type { OffcutPlate } from '@/types'
import { DEFAULT_OFFCUT_PRESETS, type OffcutPreset } from '@/lib/presets'

export interface OffcutPresetManagerProps {
  onLoadPreset?: (offcuts: OffcutPlate[]) => void
}

export function OffcutPresetManager({ onLoadPreset }: OffcutPresetManagerProps) {
  const handleLoadPreset = (preset: OffcutPreset) => {
    if (onLoadPreset) {
      onLoadPreset(preset.offcuts)
    }
  }

  return (
    <Card title="端材プリセット">
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3">
          テスト用の端材プリセットデータを読み込めます
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DEFAULT_OFFCUT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-sm text-gray-900">{preset.name}</p>
                <p className="text-xs text-gray-500">
                  端材数: {preset.offcuts.length}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLoadPreset(preset)}
              >
                読み込み
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          ※ 既存の端材リストを上書きします
        </p>
      </div>
    </Card>
  )
}
