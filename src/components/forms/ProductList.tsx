'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui'
import type { Item, PlateConfig } from '@/types'
import { COLOR_PALETTE } from '@/types/item'
import { v4 as uuidv4 } from 'uuid'

export interface ProductListProps {
  items: Item[]
  plateConfig: PlateConfig
  onAddItem: (item: Item) => void
  onUpdateItem: (item: Item) => void
  onDelete: (itemId: string) => void
}

// 次に使用可能な色を取得
const getNextColor = (items: Item[]): string => {
  const usedColors = new Set(items.map((item) => item.color))

  // COLOR_PALETTEから未使用の色を探す
  for (const color of COLOR_PALETTE) {
    if (!usedColors.has(color)) {
      return color
    }
  }

  // 全色使用済みの場合は、順番に色を返す
  return COLOR_PALETTE[items.length % COLOR_PALETTE.length]
}

export function ProductList({
  items,
  plateConfig,
  onAddItem,
  onUpdateItem,
  onDelete,
}: ProductListProps) {
  // 編集状態
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingWidth, setEditingWidth] = useState<number | ''>('')
  const [editingHeight, setEditingHeight] = useState<number | ''>('')
  const [editingQuantity, setEditingQuantity] = useState<number | ''>('')
  const [editingColor, setEditingColor] = useState('')

  // 新規追加状態
  const [newName, setNewName] = useState('')
  const [newWidth, setNewWidth] = useState<number | ''>('')
  const [newHeight, setNewHeight] = useState<number | ''>('')
  const [newQuantity, setNewQuantity] = useState<number | ''>('')

  // 編集フィールド用のrefs
  const editNameRef = useRef<HTMLInputElement>(null)
  const editWidthRef = useRef<HTMLInputElement>(null)
  const editHeightRef = useRef<HTMLInputElement>(null)
  const editQuantityRef = useRef<HTMLInputElement>(null)

  // 新規追加フィールド用のrefs
  const newNameRef = useRef<HTMLInputElement>(null)
  const newWidthRef = useRef<HTMLInputElement>(null)
  const newHeightRef = useRef<HTMLInputElement>(null)
  const newQuantityRef = useRef<HTMLInputElement>(null)

  // 合計値の計算
  const totalVarieties = items.length
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  // 次の色
  const nextColor = getNextColor(items)

  // Enterキーハンドラー（編集行用）
  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        // 最後のフィールド（Quantity）でEnterを押したら保存
        handleSave()
      }
    }
  }

  // Enterキーハンドラー（新規追加行用）
  const handleNewKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null> | null
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        // 最後のフィールド（Quantity）でEnterを押したら追加
        handleAdd()
      }
    }
  }

  // 編集開始
  const handleEdit = (item: Item) => {
    setEditingItemId(item.id)
    setEditingName(item.name)
    setEditingWidth(item.width)
    setEditingHeight(item.height)
    setEditingQuantity(item.quantity)
    setEditingColor(item.color)
    // 次のレンダリング後に最初のフィールドにフォーカス
    setTimeout(() => editNameRef.current?.focus(), 0)
  }

  // 編集保存
  const handleSave = () => {
    if (!editingItemId) return
    if (!editingName || !editingWidth || !editingHeight || !editingQuantity) {
      alert('全ての項目を入力してください')
      return
    }

    // 元板サイズを超えていないかチェック
    const width = Number(editingWidth)
    const height = Number(editingHeight)
    if (width > plateConfig.width || height > plateConfig.height) {
      alert(
        `製品サイズが元板サイズ（${plateConfig.width}mm × ${plateConfig.height}mm）を超えています`
      )
      return
    }

    const updatedItem: Item = {
      id: editingItemId,
      name: editingName,
      width: Number(editingWidth),
      height: Number(editingHeight),
      quantity: Number(editingQuantity),
      color: editingColor,
    }

    onUpdateItem(updatedItem)
    setEditingItemId(null)
  }

  // 編集キャンセル
  const handleCancel = () => {
    setEditingItemId(null)
  }

  // 新規追加
  const handleAdd = () => {
    if (!newName || !newWidth || !newHeight || !newQuantity) {
      alert('全ての項目を入力してください')
      return
    }

    // 元板サイズを超えていないかチェック
    const width = Number(newWidth)
    const height = Number(newHeight)
    if (width > plateConfig.width || height > plateConfig.height) {
      alert(
        `製品サイズが元板サイズ（${plateConfig.width}mm × ${plateConfig.height}mm）を超えています`
      )
      return
    }

    const newItem: Item = {
      id: uuidv4(),
      name: newName,
      width: Number(newWidth),
      height: Number(newHeight),
      quantity: Number(newQuantity),
      color: nextColor,
    }

    onAddItem(newItem)

    // フォームをリセット
    setNewName('')
    setNewWidth('')
    setNewHeight('')
    setNewQuantity('')
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
            {/* 既存製品 */}
            {items.map((item) => {
              const isEditing = editingItemId === item.id

              if (isEditing) {
                // 編集行
                return (
                  <tr key={item.id} className="bg-blue-50 ring-2 ring-blue-400">
                    {/* 色選択 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={editingColor}
                        onChange={(e) => setEditingColor(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {COLOR_PALETTE.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      <div
                        className="w-8 h-8 rounded border border-gray-300 mt-1"
                        style={{ backgroundColor: editingColor }}
                      />
                    </td>
                    {/* 名前 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        ref={editNameRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, editWidthRef)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Width */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        ref={editWidthRef}
                        type="number"
                        value={editingWidth}
                        onChange={(e) =>
                          setEditingWidth(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        onKeyDown={(e) => handleEditKeyDown(e, editHeightRef)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Height */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        ref={editHeightRef}
                        type="number"
                        value={editingHeight}
                        onChange={(e) =>
                          setEditingHeight(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        onKeyDown={(e) => handleEditKeyDown(e, editQuantityRef)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    {/* Quantity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        ref={editQuantityRef}
                        type="number"
                        value={editingQuantity}
                        onChange={(e) =>
                          setEditingQuantity(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        onKeyDown={(e) => handleEditKeyDown(e, null)}
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
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(item)}
                >
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.width}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.height}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.quantity}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-right text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDelete(item.id)}
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
              {/* 色プレビュー（自動割り当て） */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: nextColor }}
                  title={`自動割り当て: ${nextColor}`}
                />
              </td>
              {/* 名前入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  ref={newNameRef}
                  type="text"
                  placeholder="製品名"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => handleNewKeyDown(e, newWidthRef)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Width入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  ref={newWidthRef}
                  type="number"
                  placeholder="幅"
                  value={newWidth}
                  onChange={(e) => setNewWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={(e) => handleNewKeyDown(e, newHeightRef)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Height入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  ref={newHeightRef}
                  type="number"
                  placeholder="高さ"
                  value={newHeight}
                  onChange={(e) =>
                    setNewHeight(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  onKeyDown={(e) => handleNewKeyDown(e, newQuantityRef)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </td>
              {/* Quantity入力 */}
              <td className="px-4 py-3 whitespace-nowrap">
                <input
                  ref={newQuantityRef}
                  type="number"
                  placeholder="個数"
                  value={newQuantity}
                  onChange={(e) =>
                    setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  onKeyDown={(e) => handleNewKeyDown(e, null)}
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
          {items.length > 0 && (
            <tfoot className="bg-gray-100">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300"
                >
                  合計
                </td>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300"
                >
                  品種数: {totalVarieties}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 border-t-2 border-gray-300">
                  総数: {totalQuantity}
                </td>
                <td className="px-4 py-3 border-t-2 border-gray-300"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  )
}
