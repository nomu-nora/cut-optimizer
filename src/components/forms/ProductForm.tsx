'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Input, Button, Card, Label } from '@/components/ui'
import type { Item } from '@/types'
import { COLOR_PALETTE } from '@/types'

export interface ProductFormProps {
  editItem?: Item
  onSubmit?: (item: Item) => void
  onCancel?: () => void
}

export function ProductForm({ editItem, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Omit<Item, 'id'>>({
    name: '',
    width: 0,
    height: 0,
    quantity: 1,
    color: COLOR_PALETTE[0],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof Item, string>>>({})

  useEffect(() => {
    if (editItem) {
      setFormData({
        name: editItem.name,
        width: editItem.width,
        height: editItem.height,
        quantity: editItem.quantity,
        color: editItem.color,
      })
    }
  }, [editItem])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Item, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '製品名を入力してください'
    }

    if (formData.width <= 0) {
      newErrors.width = '0より大きい値を入力してください'
    }

    if (formData.height <= 0) {
      newErrors.height = '0より大きい値を入力してください'
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = '1以上の値を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const item: Item = {
      id: editItem?.id || uuidv4(),
      ...formData,
    }

    onSubmit?.(item)

    // Reset form if not editing
    if (!editItem) {
      setFormData({
        name: '',
        width: 0,
        height: 0,
        quantity: 1,
        color: COLOR_PALETTE[0],
      })
      setErrors({})
    }
  }

  const handleChange = (field: keyof Omit<Item, 'id'>, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }))
  }

  return (
    <Card title={editItem ? '製品を編集' : '製品を追加'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="製品名"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          fullWidth
          placeholder="例: 天板A"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="幅 (mm)"
            type="number"
            value={formData.width || ''}
            onChange={(e) => handleChange('width', parseFloat(e.target.value) || 0)}
            error={errors.width}
            fullWidth
            min="0"
            step="1"
            placeholder="300"
          />

          <Input
            label="高さ (mm)"
            type="number"
            value={formData.height || ''}
            onChange={(e) => handleChange('height', parseFloat(e.target.value) || 0)}
            error={errors.height}
            fullWidth
            min="0"
            step="1"
            placeholder="200"
          />

          <Input
            label="数量"
            type="number"
            value={formData.quantity || ''}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
            error={errors.quantity}
            fullWidth
            min="1"
            step="1"
            placeholder="1"
          />
        </div>

        <div>
          <Label className="mb-2">色</Label>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`w-10 h-10 rounded border-2 transition-all ${
                  formData.color === color
                    ? 'border-blue-600 ring-2 ring-blue-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" fullWidth>
            {editItem ? '更新' : '追加'}
          </Button>
          {editItem && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth>
              キャンセル
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
