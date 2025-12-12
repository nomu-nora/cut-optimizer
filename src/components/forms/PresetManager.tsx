'use client'

import { Button, Card } from '@/components/ui'
import type { Item } from '@/types'
import { DEFAULT_PRESETS, type Preset } from '@/lib/presets'

export interface PresetManagerProps {
  onLoadPreset?: (items: Item[]) => void
}

export function PresetManager({ onLoadPreset }: PresetManagerProps) {
  const handleLoadPreset = (preset: Preset) => {
    if (onLoadPreset) {
      onLoadPreset(preset.items)
    }
  }

  return (
    <Card title="プリセット">
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3">テスト用のプリセットデータを読み込めます</p>
        <div className="grid grid-cols-1 gap-2">
          {DEFAULT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-sm text-gray-900">{preset.name}</p>
                <p className="text-xs text-gray-500">製品数: {preset.items.length}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleLoadPreset(preset)}>
                読み込み
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">※ v1.0では既存の製品リストを上書きします</p>
      </div>
    </Card>
  )
}
