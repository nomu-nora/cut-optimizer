import type { Placement, PlateConfig, CutConfig } from '@/types'

/**
 * 製品同士の衝突をチェック（刃幅を考慮）
 * @param placement チェック対象の配置
 * @param otherPlacements 他の配置リスト
 * @param cutConfig 切断設定
 * @returns 衝突している場合true
 */
export function checkCollision(
  placement: Placement,
  otherPlacements: Placement[],
  cutConfig: CutConfig
): boolean {
  const gap = cutConfig.cutWidth

  for (const other of otherPlacements) {
    // 自分自身はスキップ
    if (other.item.id === placement.item.id) continue

    // AABB衝突判定（刃幅のギャップを含む）
    const collides = !(
      placement.x + placement.width + gap <= other.x ||
      placement.x >= other.x + other.width + gap ||
      placement.y + placement.height + gap <= other.y ||
      placement.y >= other.y + other.height + gap
    )

    if (collides) return true
  }

  return false
}

/**
 * 元板境界チェック（余白を考慮）
 * @param placement チェック対象の配置
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 境界内の場合true
 */
export function checkBounds(
  placement: Placement,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): boolean {
  const margin = cutConfig.margin

  return (
    placement.x >= margin &&
    placement.y >= margin &&
    placement.x + placement.width <= plateConfig.width - margin &&
    placement.y + placement.height <= plateConfig.height - margin
  )
}

/**
 * 配置が有効かどうかをチェック（衝突と境界の両方）
 * @param placement チェック対象の配置
 * @param otherPlacements 他の配置リスト
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 有効な場合true
 */
export function isValidPlacement(
  placement: Placement,
  otherPlacements: Placement[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): boolean {
  // 境界チェック
  if (!checkBounds(placement, plateConfig, cutConfig)) {
    return false
  }

  // 衝突チェック
  if (checkCollision(placement, otherPlacements, cutConfig)) {
    return false
  }

  return true
}

/**
 * 配置が無効な理由を取得
 * @param placement チェック対象の配置
 * @param otherPlacements 他の配置リスト
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 無効な理由（有効な場合はnull）
 */
export function getInvalidReason(
  placement: Placement,
  otherPlacements: Placement[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): string | null {
  // 境界チェック
  if (!checkBounds(placement, plateConfig, cutConfig)) {
    return '元板の範囲外です'
  }

  // 衝突チェック
  if (checkCollision(placement, otherPlacements, cutConfig)) {
    return '他の製品と重なっています'
  }

  return null
}
