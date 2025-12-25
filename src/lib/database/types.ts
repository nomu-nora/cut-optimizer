import type { OffcutMode } from '@/types'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'

/**
 * Database: user_settings table
 */
export interface UserSettings {
  id: string
  user_id: string

  // Default Plate Config
  default_plate_width: number
  default_plate_height: number
  default_plate_unit_price: number

  // Default Cut Config
  default_cut_width: number
  default_margin: number

  // Default Optimization Preferences
  default_optimization_goal: OptimizationGoal
  default_use_ga: boolean
  default_use_grid_grouping: boolean
  default_offcut_mode: OffcutMode

  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Partial settings for updates
 */
export type UserSettingsUpdate = Partial<
  Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>

/**
 * Database: product_templates table
 */
export interface ProductTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  products: string // JSONB stored as string
  created_at: string
  updated_at: string
}

/**
 * Database: offcut_templates table
 */
export interface OffcutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  offcuts: string // JSONB stored as string
  created_at: string
  updated_at: string
}

/**
 * Database: calculation_history table
 */
export interface CalculationHistory {
  id: string
  user_id: string
  plate_config: string // JSONB
  cut_config: string // JSONB
  products: string // JSONB
  offcuts: string | null // JSONB
  optimization_goal: OptimizationGoal
  use_ga: boolean
  use_grid_grouping: boolean
  offcut_mode: OffcutMode | null
  result: string // JSONB
  total_plates: number
  average_yield: number
  total_cost: number
  name: string | null
  notes: string | null
  created_at: string
}
