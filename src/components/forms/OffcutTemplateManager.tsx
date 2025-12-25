'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, ErrorMessage, Spinner } from '@/components/ui'
import {
  getOffcutTemplates,
  deleteOffcutTemplate,
  type OffcutTemplate,
} from '@/lib/database/templates'
import type { OffcutPlate } from '@/types'

export interface OffcutTemplateManagerProps {
  onLoadTemplate: (offcuts: OffcutPlate[]) => void
}

export function OffcutTemplateManager({ onLoadTemplate }: OffcutTemplateManagerProps) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<OffcutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTemplates = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getOffcutTemplates(user.id)
      setTemplates(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load offcut templates:', err)
      setError(err instanceof Error ? err.message : 'テンプレートの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [user])

  const handleLoad = (template: OffcutTemplate) => {
    onLoadTemplate(template.offcuts)
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return

    try {
      setDeletingId(templateId)
      await deleteOffcutTemplate(templateId)
      await loadTemplates() // Reload list
    } catch (err) {
      console.error('Failed to delete offcut template:', err)
      setError(err instanceof Error ? err.message : 'テンプレートの削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {error && <ErrorMessage message={error} />}

        {templates.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            保存されたテンプレートはありません
          </p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {template.offcuts.length} 個の端材 •{' '}
                  {new Date(template.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLoad(template)}
                  disabled={deletingId === template.id}
                >
                  読み込み
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(template.id)}
                  disabled={deletingId === template.id}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  {deletingId === template.id ? '削除中...' : '削除'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
