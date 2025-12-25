'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, Input, Button, Label, Spinner } from '@/components/ui'
import { getUserSettings, updateUserSettings } from '@/lib/database/settings'
import type { UserSettings } from '@/lib/database/types'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'
import type { OffcutMode } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()

  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings on mount
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }

    loadSettings()
  }, [user, authLoading, router])

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserSettings(user.id)
      setSettings(data)
      setHasChanges(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Update setting (no auto-save)
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!settings) return

    const newSettings = {
      ...settings,
      [key]: value,
    }
    setSettings(newSettings)
    setHasChanges(true)
  }

  // Manual save function
  const handleSave = async () => {
    if (!user || !settings) return

    try {
      setSaving(true)
      const settingsToSave = {
        default_plate_width: settings.default_plate_width,
        default_plate_height: settings.default_plate_height,
        default_plate_unit_price: settings.default_plate_unit_price,
        default_cut_width: settings.default_cut_width,
        default_margin: settings.default_margin,
        default_optimization_goal: settings.default_optimization_goal,
        default_use_ga: settings.default_use_ga,
        default_use_grid_grouping: settings.default_use_grid_grouping,
        default_offcut_mode: settings.default_offcut_mode,
      }
      console.log('💾 Saving settings to DB:', settingsToSave)
      await updateUserSettings(user.id, settingsToSave)
      console.log('✅ Settings saved successfully')
      setHasChanges(false)
      setError(null)

      // Navigate back to home with full reload to ensure settings are applied
      window.location.href = '/'
    } catch (err) {
      console.error('❌ Failed to save settings:', err)
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // Discard changes and go back
  const handleCancel = () => {
    router.push('/')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId?: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault()
      const nextField = document.getElementById(nextFieldId)
      if (nextField) {
        nextField.focus()
      }
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" text="設定を読み込み中..." />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p className="text-red-600">設定の読み込みに失敗しました</p>
          <Button onClick={loadSettings}>再試行</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="text-sm text-gray-600 mt-1">デフォルト値と最適化の設定を管理</p>
        </div>

        {/* Change indicator */}
        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            変更が保存されていません
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* User Profile */}
        <Card title="ユーザー情報">
          <div className="space-y-4">
            <div>
              <Label>メールアドレス</Label>
              <Input value={user?.email || ''} disabled fullWidth />
              <p className="text-xs text-gray-500 mt-1">ログインに使用しているメールアドレスです</p>
            </div>
          </div>
        </Card>

        {/* Default Plate Config */}
        <Card title="デフォルト元板設定">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>幅 (mm)</Label>
                <Input
                  id="settings-plate-width"
                  type="number"
                  value={settings.default_plate_width}
                  onChange={(e) => updateSetting('default_plate_width', Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, 'settings-plate-height')}
                  min="100"
                  max="10000"
                  fullWidth
                />
              </div>
              <div>
                <Label>高さ (mm)</Label>
                <Input
                  id="settings-plate-height"
                  type="number"
                  value={settings.default_plate_height}
                  onChange={(e) => updateSetting('default_plate_height', Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, 'settings-plate-unitPrice')}
                  min="100"
                  max="10000"
                  fullWidth
                />
              </div>
            </div>
            <div>
              <Label>単価 (円)</Label>
              <Input
                id="settings-plate-unitPrice"
                type="number"
                value={settings.default_plate_unit_price}
                onChange={(e) => updateSetting('default_plate_unit_price', Number(e.target.value))}
                onKeyDown={(e) => handleKeyDown(e, 'settings-cut-width')}
                min="0"
                fullWidth
              />
              <p className="text-xs text-gray-500 mt-1">元板1枚あたりの価格（任意）</p>
            </div>
          </div>
        </Card>

        {/* Default Cut Config */}
        <Card title="デフォルトカット設定">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>カット幅 (mm)</Label>
                <Input
                  id="settings-cut-width"
                  type="number"
                  value={settings.default_cut_width}
                  onChange={(e) => updateSetting('default_cut_width', Number(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, 'settings-cut-margin')}
                  min="0"
                  max="100"
                  step="0.1"
                  fullWidth
                />
                <p className="text-xs text-gray-500 mt-1">製品と製品の間のカット幅</p>
              </div>
              <div>
                <Label>余白 (mm)</Label>
                <Input
                  id="settings-cut-margin"
                  type="number"
                  value={settings.default_margin}
                  onChange={(e) => updateSetting('default_margin', Number(e.target.value))}
                  min="0"
                  max="500"
                  fullWidth
                />
                <p className="text-xs text-gray-500 mt-1">元板の四辺に設ける余白</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Default Optimization Preferences */}
        <Card title="デフォルト最適化設定">
          <div className="space-y-4">
            <div>
              <Label>最適化目標</Label>
              <select
                value={settings.default_optimization_goal}
                onChange={(e) =>
                  updateSetting('default_optimization_goal', e.target.value as OptimizationGoal)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="remaining-space">余白優先</option>
                <option value="yield">歩留まり優先</option>
              </select>
            </div>

            <div>
              <Label>端材モード</Label>
              <select
                value={settings.default_offcut_mode}
                onChange={(e) => updateSetting('default_offcut_mode', e.target.value as OffcutMode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="consumption">端材消費モード</option>
                <option value="optimization">端材最適化モード</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.default_use_ga}
                  onChange={(e) => updateSetting('default_use_ga', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">遺伝的アルゴリズムを使用</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.default_use_grid_grouping}
                  onChange={(e) => updateSetting('default_use_grid_grouping', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">グリッドグルーピングを使用</span>
              </label>
            </div>
          </div>
        </Card>

        {/* Account Management */}
        <Card title="アカウント管理">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">アカウントからログアウトします</p>
              <Button onClick={handleSignOut} variant="outline" fullWidth>
                ログアウト
              </Button>
            </div>
          </div>
        </Card>

        {/* Save/Cancel Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex gap-3 justify-end">
            <Button onClick={handleCancel} variant="outline" disabled={saving}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? '保存中...' : '保存してアプリに戻る'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
