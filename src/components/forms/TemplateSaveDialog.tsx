'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Label, ErrorMessage } from '@/components/ui'
import { createProductTemplate, createOffcutTemplate } from '@/lib/database/templates'
import type { Item, OffcutPlate } from '@/types'

export interface TemplateSaveDialogProps {
  type: 'product' | 'offcut'
  data: Item[] | OffcutPlate[]
  onClose: () => void
  onSaved: () => void
}

export function TemplateSaveDialog({ type, data, onClose, onSaved }: TemplateSaveDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) return
    if (!name.trim()) {
      setError('テンプレート名を入力してください')
      return
    }

    try {
      setSaving(true)
      setError(null)

      console.log(`💾 Saving ${type} template:`, {
        name: name.trim(),
        description: description.trim() || undefined,
        itemCount: data.length,
      })

      if (type === 'product') {
        const result = await createProductTemplate(user.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          products: data as Item[],
        })
        console.log('✅ Product template saved:', result)
      } else {
        const result = await createOffcutTemplate(user.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          offcuts: data as OffcutPlate[],
        })
        console.log('✅ Offcut template saved:', result)
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('❌ Failed to save template:', err)
      setError(err instanceof Error ? err.message : 'テンプレートの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId)
        if (nextField) {
          nextField.focus()
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {type === 'product' ? '製品' : '端材'}テンプレートを保存
        </h2>

        <div className="space-y-4">
          <div>
            <Label>テンプレート名 *</Label>
            <Input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'template-description')}
              placeholder="例: 標準製品セット"
              fullWidth
              autoFocus
            />
          </div>

          <div>
            <Label>説明（任意）</Label>
            <Input
              id="template-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'template-save-button')}
              placeholder="例: よく使う製品の組み合わせ"
              fullWidth
            />
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              キャンセル
            </Button>
            <Button
              id="template-save-button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
