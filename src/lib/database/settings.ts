import { createClient } from '@/lib/supabase/client'
import type { UserSettings, UserSettingsUpdate } from './types'
import { DEFAULT_PLATE_CONFIG, DEFAULT_CUT_CONFIG } from '@/types'

/**
 * Get user settings from database
 * If settings don't exist, creates default settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Settings don't exist, create defaults
    if (error.code === 'PGRST116') {
      return await createDefaultUserSettings(userId)
    }
    throw new Error(`Failed to get user settings: ${error.message}`)
  }

  return data
}

/**
 * Create default user settings
 */
export async function createDefaultUserSettings(userId: string): Promise<UserSettings> {
  const supabase = createClient()

  const defaultSettings = {
    user_id: userId,
    default_plate_width: DEFAULT_PLATE_CONFIG.width,
    default_plate_height: DEFAULT_PLATE_CONFIG.height,
    default_plate_unit_price: DEFAULT_PLATE_CONFIG.unitPrice,
    default_cut_width: DEFAULT_CUT_CONFIG.cutWidth,
    default_margin: DEFAULT_CUT_CONFIG.margin,
    default_optimization_goal: 'remaining-space' as const,
    default_use_ga: false,
    default_use_grid_grouping: true,
    default_offcut_mode: 'consumption' as const,
  }

  const { data, error } = await supabase
    .from('user_settings')
    .insert(defaultSettings)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create default settings: ${error.message}`)
  }

  return data
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: UserSettingsUpdate
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`)
  }
}

/**
 * Delete user settings (for cleanup/reset)
 */
export async function deleteUserSettings(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('user_settings').delete().eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete settings: ${error.message}`)
  }
}
