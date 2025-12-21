'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import type { OffcutPlate } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export interface OffcutListProps {
  offcuts: OffcutPlate[]
  onAddOffcut: (offcut: OffcutPlate) => void
  onUpdateOffcut: (offcut: OffcutPlate) => void
  onDelete: (offcutId: string) => void
}

export function OffcutList({ offcuts, onAddOffcut, onUpdateOffcut, onDelete }: OffcutListProps) {
  // 編集状態
  const [editingOffcutId, setEditingOffcutId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingWidth, setEditingWidth] = useState<number | ''>('')
  const [editingHeight, setEditingHeight] = useState<number | ''>('')
  const [editingQuantity, setEditingQuantity] = useState<number | ''>('')

  // 新規追加状態
  const [newName, setNewName] = useState('')
  const [newWidth, setNewWidth] = useState<number | ''>('')
  const [newHeight, setNewHeight] = useState<number | ''>('')
  const [newQuantity, setNewQuantity] = useState<number | ''>('')

  // 合計値の計算
  const totalVarieties = offcuts.length
  const totalQuantity = offcuts.reduce((sum, offcut) => sum + offcut.quantity, 0)

  // 編集開始
  const handleEdit = (offcut: OffcutPlate) => {
    setEditingOffcutId(offcut.id)
    setEditingName(offcut.name)
    setEditingWidth(offcut.width)
    setEditingHeight(offcut.height)
    setEditingQuantity(offcut.quantity)
  }

  // 編集保存
  const handleSave = () => {
    if (!editingOffcutId) return
    if (!editingName || !editingWidth || !editingHeight || !editingQuantity) {
      alert('全ての項目を入力してください')
      return
    }

    const updatedOffcut: OffcutPlate = {
      id: editingOffcutId,
      name: editingName,
      width: Number(editingWidth),
      height: Number(editingHeight),
      quantity: Number(editingQuantity),
    }

    onUpdateOffcut(updatedOffcut)
    setEditingOffcutId(null)
  }

  // 編集キャンセル
  const handleCancel = () => {
    setEditingOffcutId(null)
  }

  // 新規追加
  const handleAdd = () => {
    if (!newName || !newWidth || !newHeight || !newQuantity) {
      alert('全ての項目を入力してください')
      return
    }

    const newOffcut: OffcutPlate = {
      id: uuidv4(),
      name: newName,
      width: Number(newWidth),
      height: Number(newHeight),
      quantity: Number(newQuantity),
    }

    onAddOffcut(newOffcut)

    // フォームをリセット
    setNewName('')
    setNewWidth('')
    setNewHeight('')
    setNewQuantity('')
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
            {/* 既存端材 */}
            {offcuts.map((offcut) => {
              const isEditing = editingOffcutId === offcut.id

              if (isEditing) {
                // 編集行
                return (
                  <tr key={offcut.id} className="bg-blue-50 ring-2 ring-blue-400">
                    {/* 名前 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Width */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={editingWidth}
                        onChange={(e) =>
                          setEditingWidth(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Height */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={editingHeight}
                        onChange={(e) =>
                          setEditingHeight(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Quantity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={editingQuantity}
                        onChange={(e) =>
                          setEditingQuantity(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* アクション */}
                    <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm font-medium"
                      >
                        ✗
                      </button>
                    </td>
                  </tr>
                )
              }

              // 通常行
              return (
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
                    <button
                      onClick={() => handleEdit(offcut)}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(offcut.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              )
            })}

            {/* 新規追加行 */}
            <tr className="bg-gray-50">
              {/* 名前入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  type="text"
                  placeholder="端材名"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Width入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  type="number"
                  placeholder="幅"
                  value={newWidth}
                  onChange={(e) => setNewWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Height入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  type="number"
                  placeholder="高さ"
                  value={newHeight}
                  onChange={(e) =>
                    setNewHeight(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Quantity入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  type="number"
                  placeholder="個数"
                  value={newQuantity}
                  onChange={(e) =>
                    setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* 追加ボタン */}
              <td className="px-4 py-3 whitespace-nowrap text-right">
                <button
                  onClick={handleAdd}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                >
                  追加
                </button>
              </td>
            </tr>
          </tbody>

          {/* 合計行 */}
          {offcuts.length > 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300">
                  合計
                </td>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300"
                >
                  品種数: {totalVarieties}
                </td>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300"
                >
                  総数: {totalQuantity}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  )
}
