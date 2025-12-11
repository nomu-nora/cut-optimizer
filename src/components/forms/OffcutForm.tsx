'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button, Card, Input } from '@/components/ui'
import type { OffcutPlate } from '@/types'

interface OffcutFormProps {
  editItem?: OffcutPlate
  onSubmit: (offcut: OffcutPlate) => void
  onCancel?: () => void
}

interface FormErrors {
  name?: string
  width?: string
  height?: string
  quantity?: string
}

export function OffcutForm({ editItem, onSubmit, onCancel }: OffcutFormProps) {
  const [formData, setFormData] = useState<OffcutPlate>({
    id: '',
    name: '',
    width: 0,
    height: 0,
    quantity: 1,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // 編集モード時にフォームにデータをセット
  useEffect(() => {
    if (editItem) {
      setFormData(editItem)
    }
  }, [editItem])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '端材名を入力してください'
    }

    if (formData.width <= 0) {
      newErrors.width = '幅を入力してください'
    }

    if (formData.height <= 0) {
      newErrors.height = '高さを入力してください'
    }

    if (formData.quantity < 1) {
      newErrors.quantity = '数量は1以上を入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const offcut: OffcutPlate = {
      ...formData,
      id: formData.id || uuidv4(),
    }

    onSubmit(offcut)

    // 編集モードでない場合はフォームをリセット
    if (!editItem) {
      setFormData({
        id: '',
        name: '',
        width: 0,
        height: 0,
        quantity: 1,
      })
      setErrors({})
    }
  }

  const handleChange = (field: keyof Omit<OffcutPlate, 'id'>, value: string | number) => {
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
    <Card title={editItem ? '端材を編集' : '端材を追加'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="端材名"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          fullWidth
          placeholder="例: 端材A"
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
            placeholder="400"
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
            placeholder="300"
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
