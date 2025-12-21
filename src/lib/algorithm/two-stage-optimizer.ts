/**
 * 2段階最適化アルゴリズム
 * Stage 1: 初期配置（既存のMaximal Rectangles）
 * Stage 2: パターン再編成（歩留まり優先 or スペース優先）
 */

import type {
  PlateConfig,
  CutConfig,
  Item,
  CalculationResult,
  PatternGroup,
  Placement,
} from '@/types'
import { calculateMaximalRectangles } from './maximal-rectangles'
import { reorganizeForYield } from './reorganize-yield'
import { reorganizeForSpace } from './reorganize-space'

export type OptimizationGoal = 'yield' | 'remaining-space'

/**
 * 2段階最適化のメインエントリーポイント
 */
export function calculateWithTwoStageOptimization(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  optimizationGoal: OptimizationGoal,
  enableGridGrouping: boolean
): CalculationResult {
  // ===== Stage 1: 初期配置 =====
  console.log('🔷 Stage 1 開始: 初期配置')

  const stage1Result = calculateMaximalRectangles(
    plateConfig,
    cutConfig,
    items,
    optimizationGoal,
    enableGridGrouping
  )

  console.log(
    `✅ Stage 1 完了: ${stage1Result.totalPlates}枚, 平均歩留まり ${stage1Result.averageYield.toFixed(1)}%`
  )

  // ===== Stage 2: パターン再編成 =====
  console.log(
    `🔷 Stage 2 開始: ${optimizationGoal === 'yield' ? '歩留まり優先' : 'スペース優先'}再編成`
  )

  const stage2Result =
    optimizationGoal === 'yield'
      ? reorganizeForYield(stage1Result, plateConfig, cutConfig)
      : reorganizeForSpace(stage1Result, plateConfig, cutConfig)

  console.log(
    `✅ Stage 2 完了: ${stage2Result.totalPlates}枚, 平均歩留まり ${stage2Result.averageYield.toFixed(1)}%`
  )

  return stage2Result
}

// ===== ユーティリティ関数 =====

/**
 * パターンから全製品を抽出
 */
export function extractAllItemsFromPatterns(patterns: PatternGroup[]): Item[] {
  const items: Item[] = []

  for (const pattern of patterns) {
    for (const placement of pattern.placements) {
      // パターンのcount分だけ製品を複製
      for (let i = 0; i < pattern.count; i++) {
        items.push(placement.item)
      }
    }
  }

  return items
}

/**
 * 単一パターンから製品を抽出
 */
export function extractItemsFromPattern(pattern: PatternGroup): Item[] {
  return pattern.placements.map((p) => p.item)
}

/**
 * パターンから計算結果を再構築
 *
 * 注意: この関数は簡易版で、averageYield, totalCost等を再計算します
 */
export function rebuildCalculationResult(
  patterns: PatternGroup[],
  originalResult: CalculationResult,
  plateConfig: PlateConfig
): CalculationResult {
  // 元板枚数を計算
  const totalPlates = patterns.reduce((sum, p) => sum + p.count, 0)

  // 【検証】元板枚数が増えていないかチェック
  const originalTotalPlates = originalResult.patterns
    .filter((p) => !p.isOffcut)
    .reduce((sum, p) => sum + p.count, 0)

  if (totalPlates > originalTotalPlates) {
    console.error(`⚠️ 警告: 元板枚数が増加しています: ${originalTotalPlates}枚 → ${totalPlates}枚`)
  }

  // 平均歩留まりを計算（加重平均）
  const totalYield = patterns.reduce((sum, p) => sum + p.yield * p.count, 0)
  const averageYield = totalPlates > 0 ? totalYield / totalPlates : 0

  // 総コスト
  const totalCost = totalPlates * plateConfig.unitPrice

  // v1.5メトリクス（後で再計算される）
  const regularPatterns = patterns.filter((p) => !p.isOffcut)
  const yieldExcludingLast =
    regularPatterns.length > 1
      ? regularPatterns.slice(0, -1).reduce((sum, p) => sum + p.yield * p.count, 0) /
        regularPatterns.slice(0, -1).reduce((sum, p) => sum + p.count, 0)
      : regularPatterns[0]?.yield || 0

  const lastPatternYield =
    regularPatterns.length > 0 ? regularPatterns[regularPatterns.length - 1].yield : 0

  const meetsYieldTarget = regularPatterns.length > 1 && yieldExcludingLast >= 85

  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
    skippedItems: originalResult.skippedItems,
    offcutUsage: originalResult.offcutUsage,
    yieldExcludingLast,
    lastPatternYield,
    meetsYieldTarget,
    targetYield: 85,
  }
}
