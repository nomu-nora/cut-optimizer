'use client'

import { Card, Button } from '@/components/ui'
import type { Item } from '@/types'

export interface ProductListProps {
  items: Item[]
  onEdit?: (item: Item) => void
  onDelete?: (itemId: string) => void
}

export function ProductList({ items, onEdit, onDelete }: ProductListProps) {
  if (items.length === 0) {
    return (
      <Card title="製品一覧">
        <p className="text-gray-500 text-center py-8">
          製品が登録されていません。下のフォームから製品を追加してください。
        </p>
      </Card>
    )
  }

  return (
    <Card title="製品一覧" noPadding>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                色
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                製品名
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
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: item.color }}
                    title={item.color}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.width}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.height}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                      編集
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(item.id)}>
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
