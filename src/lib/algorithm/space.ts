import type { FreeSpace, Placement, CutConfig } from '@/types'

/**
 * 製品を配置した後、残りのスペースを2分割する
 * - 横分割（右側に残る）
 * - 縦分割（下側に残る）
 *
 * @param space 元の空きスペース
 * @param placement 配置された製品
 * @param cutConfig 切断設定
 * @returns 分割後の空きスペースのリスト
 */
export function splitSpace(
  space: FreeSpace,
  placement: Placement,
  cutConfig: CutConfig
): FreeSpace[] {
  const newSpaces: FreeSpace[] = []

  // 横分割（右側に残る）
  if (space.width > placement.width + cutConfig.cutWidth) {
    newSpaces.push({
      x: space.x + placement.width + cutConfig.cutWidth,
      y: space.y,
      width: space.width - placement.width - cutConfig.cutWidth,
      height: space.height,
    })
  }

  // 縦分割（下側に残る）
  if (space.height > placement.height + cutConfig.cutWidth) {
    newSpaces.push({
      x: space.x,
      y: space.y + placement.height + cutConfig.cutWidth,
      width: placement.width,
      height: space.height - placement.height - cutConfig.cutWidth,
    })
  }

  return newSpaces
}

/**
 * 空きスペースをマージして最適化する（オプション）
 * v1.0では未実装、将来の最適化として残す
 *
 * @param spaces 空きスペースのリスト
 * @returns マージ後の空きスペースのリスト
 */
export function mergeSpaces(spaces: FreeSpace[]): FreeSpace[] {
  // TODO: v2.0で実装
  // 隣接するスペースをマージしてより大きなスペースを作る
  return spaces
}

/**
 * 空きスペースリストから最大のスペースを取得
 *
 * @param spaces 空きスペースのリスト
 * @returns 最大のスペース（見つからない場合はnull）
 */
export function getMaxSpace(spaces: FreeSpace[]): FreeSpace | null {
  if (spaces.length === 0) return null

  return spaces.reduce((max, space) => {
    const maxArea = max.width * max.height
    const spaceArea = space.width * space.height
    return spaceArea > maxArea ? space : max
  })
}

/**
 * 空きスペースリストを面積順にソート（大→小）
 *
 * @param spaces 空きスペースのリスト
 * @returns ソート済みのスペースリスト
 */
export function sortSpacesByArea(spaces: FreeSpace[]): FreeSpace[] {
  return [...spaces].sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    return areaB - areaA
  })
}
