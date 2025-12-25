import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserSettings } from '@/lib/database/settings'
import type { UserSettings } from '@/lib/database/types'
import type { PlateConfig, CutConfig, OffcutMode } from '@/types'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'

export interface AppSettings {
  plateConfig: PlateConfig
  cutConfig: CutConfig
  optimizationGoal: OptimizationGoal
  useGA: boolean
  useGridGrouping: boolean
  offcutMode: OffcutMode
}

export function useAppInitialization() {
  const { user, loading: authLoading } = useAuth()
  const [appReady, setAppReady] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    if (!user) return

    try {
      // 1. Load user settings from database
      const userSettings = await getUserSettings(user.id)
      console.log('📥 Loaded user settings from DB:', userSettings)

      // 2. Convert to app settings format
      const appSettings: AppSettings = {
        plateConfig: {
          width: userSettings.default_plate_width,
          height: userSettings.default_plate_height,
          unitPrice: userSettings.default_plate_unit_price,
        },
        cutConfig: {
          cutWidth: userSettings.default_cut_width,
          margin: userSettings.default_margin,
        },
        optimizationGoal: userSettings.default_optimization_goal,
        useGA: userSettings.default_use_ga,
        useGridGrouping: userSettings.default_use_grid_grouping,
        offcutMode: userSettings.default_offcut_mode,
      }

      console.log('✅ Converted to app settings:', appSettings)
      setSettings(appSettings)
      setError(null)
    } catch (err) {
      console.error('❌ Failed to load user settings:', err)
      setError(err instanceof Error ? err.message : '設定の読み込みに失敗しました')
    } finally {
      setAppReady(true)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      // Not logged in - redirect handled by middleware
      return
    }

    loadSettings()
  }, [user, authLoading, loadSettings])

  return { appReady, settings, error, user, refetchSettings: loadSettings }
}
