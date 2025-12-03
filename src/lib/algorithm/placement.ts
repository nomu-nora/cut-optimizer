import type { Item, FreeSpace, CutConfig, CanPlaceResult } from '@/types'

/**
 * 製品が空きスペースに配置可能かチェックする
 *
 * @param item 製品
 * @param space 空きスペース
 * @param cutConfig 切断設定
 * @param rotated 90度回転するか
 * @returns 配置可能かどうか
 */
export function canPlace(
  item: Item,
  space: FreeSpace,
  cutConfig: CutConfig,
  rotated: boolean
): boolean {
  // 配置時のサイズ（回転考慮）
  const width = rotated ? item.height : item.width
  const height = rotated ? item.width : item.height

  // カット幅を考慮したサイズ
  const requiredWidth = width + cutConfig.cutWidth
  const requiredHeight = height + cutConfig.cutWidth

  // 空きスペースに収まるかチェック
  return requiredWidth <= space.width && requiredHeight <= space.height
}

/**
 * 配置後の空きスペースをシミュレートする
 * スペース分割の結果を返す
 *
 * @param item 製品
 * @param space 空きスペース
 * @param cutConfig 切断設定
 * @param rotated 90度回転するか
 * @returns 配置後の空きスペースのリスト
 */
function simulatePlacement(
  item: Item,
  space: FreeSpace,
  cutConfig: CutConfig,
  rotated: boolean
): FreeSpace[] {
  const width = rotated ? item.height : item.width
  const height = rotated ? item.width : item.height

  const newSpaces: FreeSpace[] = []

  // 横分割（右側に残る）
  if (space.width > width + cutConfig.cutWidth) {
    newSpaces.push({
      x: space.x + width + cutConfig.cutWidth,
      y: space.y,
      width: space.width - width - cutConfig.cutWidth,
      height: space.height,
    })
  }

  // 縦分割（下側に残る）
  if (space.height > height + cutConfig.cutWidth) {
    newSpaces.push({
      x: space.x,
      y: space.y + height + cutConfig.cutWidth,
      width: width,
      height: space.height - height - cutConfig.cutWidth,
    })
  }

  return newSpaces
}

/**
 * 空きスペースリストの中で最大の面積を持つスペースを取得
 *
 * @param spaces 空きスペースのリスト
 * @returns 最大スペースの面積（mm²）
 */
function getMaxSpaceArea(spaces: FreeSpace[]): number {
  if (spaces.length === 0) return 0

  return Math.max(...spaces.map((space) => space.width * space.height))
}

/**
 * 配置判定（残スペース最大化ヒューリスティック）
 * 回転なし/ありの両方を試して、最大空きスペースが大きくなる方を選択
 *
 * @param item 製品
 * @param space 空きスペース
 * @param cutConfig 切断設定
 * @returns 配置可能性の判定結果
 */
export function decideRotation(
  item: Item,
  space: FreeSpace,
  cutConfig: CutConfig
): CanPlaceResult {
  const canPlaceWithoutRotation = canPlace(item, space, cutConfig, false)
  const canPlaceWithRotation = canPlace(item, space, cutConfig, true)

  // どちらも配置できない場合
  if (!canPlaceWithoutRotation && !canPlaceWithRotation) {
    return {
      canPlace: false,
      rotated: false,
    }
  }

  // 回転なしのみ配置可能
  if (canPlaceWithoutRotation && !canPlaceWithRotation) {
    return {
      canPlace: true,
      rotated: false,
    }
  }

  // 回転ありのみ配置可能
  if (!canPlaceWithoutRotation && canPlaceWithRotation) {
    return {
      canPlace: true,
      rotated: true,
    }
  }

  // 両方配置可能な場合、残スペース最大化ヒューリスティックで判定
  const spacesWithoutRotation = simulatePlacement(item, space, cutConfig, false)
  const maxSpaceWithoutRotation = getMaxSpaceArea(spacesWithoutRotation)

  const spacesWithRotation = simulatePlacement(item, space, cutConfig, true)
  const maxSpaceWithRotation = getMaxSpaceArea(spacesWithRotation)

  // 最大空きスペースが大きい方を選択
  // 同じ場合は回転なしを優先
  const rotated = maxSpaceWithRotation > maxSpaceWithoutRotation

  return {
    canPlace: true,
    rotated,
    maxSpaceArea: rotated ? maxSpaceWithRotation : maxSpaceWithoutRotation,
  }
}
