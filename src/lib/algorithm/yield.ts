import type { Plate, PlateConfig, CutConfig } from '@/types'

/**
 * 有効エリアを計算する
 * 元板サイズから余白を引いた領域
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 有効エリアの面積（mm²）
 */
export function calculateEffectiveArea(
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): number {
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
