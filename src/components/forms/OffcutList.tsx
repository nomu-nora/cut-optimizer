'use client'

import { Card, Button } from '@/components/ui'
import type { OffcutPlate } from '@/types'

export interface OffcutListProps {
  offcuts: OffcutPlate[]
  onEdit?: (offcut: OffcutPlate) => void
  onDelete?: (offcutId: string) => void
}

export function OffcutList({ offcuts, onEdit, onDelete }: OffcutListProps) {
  if (offcuts.length === 0) {
    return (
      <Card title="端材一覧">
        <p className="text-gray-500 text-center py-8">
          端材が登録されていません。下のフォームから端材を追加してください。
        </p>
      </Card>
    )
  }

  return (
    <Card title="端材一覧" noPadding>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                端材名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                幅 (mm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                高さ (mm)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                数量
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offcuts.map((offcut) => (
              <tr key={offcut.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {offcut.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {offcut.width}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {offcut.height}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {offcut.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(offcut)}>
                      編集
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(offcut.id)}>
                      削除
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
