import { useState } from 'react'
import type { PatternGroup } from '@/types'

interface SplitPatternDialogProps {
  pattern: PatternGroup
  onSplit: (splitCount: number) => void
  onClose: () => void
}

/**
 * パターン分割ダイアログ
 * 親パターンから指定枚数を分割して子パターンを作成
 */
export function SplitPatternDialog({ pattern, onSplit, onClose }: SplitPatternDialogProps) {
  const [splitCount, setSplitCount] = useState(1)

  const handleSplit = () => {
    onSplit(splitCount)
    onClose()
  }

  const remainingCount = pattern.count - splitCount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          パターン{pattern.patternId}を分割
        </h2>

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-4">
            現在のパターン枚数:{' '}
            <span className="font-semibold text-gray-900">{pattern.count}枚</span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">何枚分割しますか？</label>

          <div className="space-y-4">
            {/* スライダー */}
            <input
              type="range"
              min="1"
              max={pattern.count - 1}
              value={splitCount}
              onChange={(e) => setSplitCount(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            {/* 数値入力 */}
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max={pattern.count - 1}
                value={splitCount}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (value >= 1 && value < pattern.count) {
                    setSplitCount(value)
                  }
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-sm text-gray-600">枚</span>
            </div>
          </div>
        </div>

        {/* 分割後のプレビュー */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">分割後：</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">親パターン{pattern.patternId}:</span>
              <span className="font-semibold text-gray-900">{remainingCount}枚</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">新パターン{pattern.patternId}-*:</span>
              <span className="font-semibold text-blue-600">{splitCount}枚</span>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="text-xs text-gray-500 mb-6">
          ※ 親パターンから指定枚数を分割して、新しい子パターンを作成します
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSplit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            分割実行
          </button>
        </div>
      </div>
    </div>
  )
}
