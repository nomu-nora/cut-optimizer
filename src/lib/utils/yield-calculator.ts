import type { Placement, PlateConfig } from '@/types'

/**
 * 配置リストから歩留まり率を計算
 * @param placements 配置リスト
 * @param plateWidth 元板の幅（mm）
 * @param plateHeight 元板の高さ（mm）
 * @returns 歩留まり率（%）
 */
export function calculateYield(
  placements: Placement[],
  plateWidth: number,
  plateHeight: number
): number {
  // 元板の総面積
  const totalArea = plateWidth * plateHeight

  // 配置された製品の合計面積
  const usedArea = placements.reduce((sum, placement) => {
    return sum + placement.width * placement.height
  }, 0)

  // 歩留まり率（%）
  return (usedArea / totalArea) * 100
}

/**
 * 配置リストから使用面積を計算
 * @param placements 配置リスト
 * @returns 使用面積（mm²）
 */
export function calculateUsedArea(placements: Placement[]): number {
  return placements.reduce((sum, placement) => {
    return sum + placement.width * placement.height
  }, 0)
}
