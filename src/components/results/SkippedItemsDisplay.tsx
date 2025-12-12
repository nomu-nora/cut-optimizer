import { Card } from '@/components/ui'
import type { SkippedItem } from '@/types'

export interface SkippedItemsDisplayProps {
  skippedItems?: SkippedItem[]
}

export function SkippedItemsDisplay({ skippedItems }: SkippedItemsDisplayProps) {
  if (!skippedItems || skippedItems.length === 0) {
    return null
  }

  const getReasonText = (reason: string): string => {
    switch (reason) {
      case 'TOO_LARGE':
        return '元板より大きいため配置できません'
      default:
        return '配置できません'
    }
  }

  return (
    <Card>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">スキップされた製品があります</h3>
            <div className="mt-2">
              <div className="space-y-2">
                {skippedItems.map((item, index) => (
                  <div
                    key={`${item.itemName}-${index}`}
                    className="bg-white border border-yellow-300 rounded p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                        <p className="text-xs text-yellow-700 mt-1">{getReasonText(item.reason)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-yellow-700">
              これらの製品は計算結果に含まれていません。元板サイズを大きくするか、製品サイズを小さくしてください。
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
