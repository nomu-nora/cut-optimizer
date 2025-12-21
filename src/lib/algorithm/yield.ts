import type { Plate, PlateConfig, CutConfig, PatternGroup } from '@/types'

/**
 * 有効エリアを計算する
 * 元板サイズから余白を引いた領域
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 有効エリアの面積（mm²）
 */
export function calculateEffectiveArea(plateConfig: PlateConfig, cutConfig: CutConfig): number {
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2
  return effectiveWidth * effectiveHeight
}

/**
 * 元板の歩留まり率を計算する
 * 歩留まり率 = 使用面積 / 有効エリア × 100
 *
 * @param plate 元板
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 歩留まり率（%）
 */
export function calculateYield(
  plate: Plate,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): number {
  const effectiveArea = calculateEffectiveArea(plateConfig, cutConfig)

  if (effectiveArea === 0) return 0

  return (plate.usedArea / effectiveArea) * 100
}

/**
 * 平均歩留まり率を計算する
 *
 * @param plates 元板のリスト
 * @returns 平均歩留まり率（%）
 */
export function calculateAverageYield(plates: Plate[]): number {
  if (plates.length === 0) return 0

  const totalYield = plates.reduce((sum, plate) => sum + plate.yield, 0)
  return totalYield / plates.length
}

/**
 * 製品の使用面積を計算する
 *
 * @param width 幅（mm）
 * @param height 高さ（mm）
 * @returns 面積（mm²）
 */
export function calculateItemArea(width: number, height: number): number {
  return width * height
}

// ===== v1.5: 新規追加関数 =====

/**
 * 最後のパターンを除いた平均歩留まり率を計算する
 * 歩留まり優先モードでの最適化評価に使用
 *
 * @param patterns パターングループのリスト
 * @returns 最後のパターンを除いた平均歩留まり率（%）
 */
export function calculateYieldExcludingLast(patterns: PatternGroup[]): number {
  // 端材パターンを除外
  const regularPatterns = patterns.filter((p) => !p.isOffcut)

  // パターンが1つ以下の場合はそのパターンの歩留まりを返す
  if (regularPatterns.length <= 1) {
    return regularPatterns[0]?.yield || 0
  }

  // 最後のパターンを除外
  const patternsExcludingLast = regularPatterns.slice(0, -1)

  // 加重平均を計算（各パターンの歩留まり × 枚数）
  const totalYield = patternsExcludingLast.reduce((sum, p) => sum + p.yield * p.count, 0)
  const totalCount = patternsExcludingLast.reduce((sum, p) => sum + p.count, 0)

  return totalCount > 0 ? totalYield / totalCount : 0
}

/**
 * 最後のパターンの歩留まり率を取得する
 *
 * @param patterns パターングループのリスト
 * @returns 最後のパターンの歩留まり率（%）
 */
export function getLastPatternYield(patterns: PatternGroup[]): number {
  // 端材パターンを除外
  const regularPatterns = patterns.filter((p) => !p.isOffcut)

  if (regularPatterns.length === 0) return 0

  // 配列の最後の要素が「最後のパターン」
  return regularPatterns[regularPatterns.length - 1].yield
}

/**
 * 歩留まり目標を達成しているかチェック
 *
 * @param patterns パターングループのリスト
 * @param targetYield 目標歩留まり率（デフォルト: 85%）
 * @returns true: 目標達成、false: 目標未達成
 */
export function meetsYieldTarget(patterns: PatternGroup[], targetYield: number = 85): boolean {
  const yieldExcludingLast = calculateYieldExcludingLast(patterns)

  // 端材パターンを除外
  const regularPatterns = patterns.filter((p) => !p.isOffcut)

  // パターンが1つ以下の場合は評価不可
  if (regularPatterns.length <= 1) return false

  return yieldExcludingLast >= targetYield
}
