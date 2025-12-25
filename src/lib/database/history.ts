import { createClient } from '@/lib/supabase/client'
import type {
  PlateConfig,
  CutConfig,
  Item,
  OffcutPlate,
  CalculationResult,
  OffcutMode,
} from '@/types'
import type { OptimizationGoal } from '@/lib/algorithm/guillotine'

/**
 * Calculation History Database Operations
 */

export interface CalculationHistory {
  id: string
  user_id: string
  plate_config: PlateConfig
  cut_config: CutConfig
  products: Item[]
  offcuts: OffcutPlate[]
  optimization_goal: OptimizationGoal
  use_ga: boolean
  use_grid_grouping: boolean
  offcut_mode: OffcutMode
  result: CalculationResult
  total_plates: number
  average_yield: number
  total_cost: number
  name: string | null
  notes: string | null
  is_starred: boolean
  created_at: string
}

export interface CalculationHistoryCreate {
  plate_config: PlateConfig
  cut_config: CutConfig
  products: Item[]
  offcuts: OffcutPlate[]
  optimization_goal: OptimizationGoal
  use_ga: boolean
  use_grid_grouping: boolean
  offcut_mode: OffcutMode
  result: CalculationResult
  name?: string
  notes?: string
}

/**
 * Save a calculation to history
 */
export async function saveCalculationHistory(
  userId: string,
  calculation: CalculationHistoryCreate
): Promise<CalculationHistory> {
  const supabase = createClient()

  // Extract summary metrics from result
  const totalPlates = calculation.result.patterns.reduce((sum, p) => sum + p.count, 0)
  const yieldSum = calculation.result.patterns.reduce((sum, p) => sum + p.yield * p.count, 0)
  const averageYield = totalPlates > 0 ? yieldSum / totalPlates : 0
  const totalCost = calculation.result.totalCost || 0

  console.log('📊 Calculation metrics:', {
    totalPlates,
    yieldSum,
    averageYield,
    totalCost,
    patternsCount: calculation.result.patterns.length,
  })

  // Ensure averageYield is a valid number
  const finalAverageYield = isNaN(averageYield) || !isFinite(averageYield) ? 0 : averageYield

  const { data, error } = await supabase
    .from('calculation_history')
    .insert({
      user_id: userId,
      plate_config: calculation.plate_config,
      cut_config: calculation.cut_config,
      products: calculation.products,
      offcuts: calculation.offcuts,
      optimization_goal: calculation.optimization_goal,
      use_ga: calculation.use_ga,
      use_grid_grouping: calculation.use_grid_grouping,
      offcut_mode: calculation.offcut_mode,
      result: calculation.result,
      total_plates: totalPlates,
      average_yield: finalAverageYield,
      total_cost: totalCost,
      name: calculation.name || null,
      notes: calculation.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save calculation history: ${error.message}`)
  }

  console.log('✅ Calculation saved to history:', data.id)
  return data
}

/**
 * Get calculation history for a user with pagination
 */
export async function getCalculationHistory(
  userId: string,
  limit = 100,
  offset = 0
): Promise<CalculationHistory[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('calculation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get calculation history: ${error.message}`)
  }

  return data || []
}

/**
 * Get a single calculation from history
 */
export async function getCalculationById(
  calculationId: string
): Promise<CalculationHistory | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('calculation_history')
    .select('*')
    .eq('id', calculationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get calculation: ${error.message}`)
  }

  return data
}

/**
 * Update calculation name/notes/starred
 */
export async function updateCalculationHistory(
  calculationId: string,
  updates: { name?: string; notes?: string; is_starred?: boolean }
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('calculation_history')
    .update(updates)
    .eq('id', calculationId)

  if (error) {
    throw new Error(`Failed to update calculation: ${error.message}`)
  }
}

/**
 * Toggle starred status
 */
export async function toggleCalculationStar(
  calculationId: string,
  isStarred: boolean
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('calculation_history')
    .update({ is_starred: isStarred })
    .eq('id', calculationId)

  if (error) {
    throw new Error(`Failed to toggle star: ${error.message}`)
  }
}

/**
 * Delete a calculation from history
 */
export async function deleteCalculationHistory(calculationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('calculation_history').delete().eq('id', calculationId)

  if (error) {
    throw new Error(`Failed to delete calculation: ${error.message}`)
  }
}

/**
 * Delete old calculations keeping only the latest N unstarred items
 * Starred items are never deleted automatically
 * This is called automatically after saving new calculation
 */
export async function cleanupOldCalculations(
  userId: string,
  keepUnstarredCount = 30
): Promise<void> {
  const supabase = createClient()

  // Get all unstarred calculations ordered by date
  const { data: unstarredCalculations, error: fetchError } = await supabase
    .from('calculation_history')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('is_starred', false)
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('Failed to fetch calculations for cleanup:', fetchError)
    return
  }

  // If we have more than keepUnstarredCount, delete the oldest unstarred ones
  if (unstarredCalculations && unstarredCalculations.length > keepUnstarredCount) {
    const idsToDelete = unstarredCalculations.slice(keepUnstarredCount).map((c) => c.id)

    const { error: deleteError } = await supabase
      .from('calculation_history')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      console.error('Failed to cleanup old calculations:', deleteError)
    } else {
      console.log(`🗑️ Cleaned up ${idsToDelete.length} old unstarred calculations`)
    }
  }
}
