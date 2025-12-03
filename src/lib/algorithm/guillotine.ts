import { v4 as uuidv4 } from 'uuid'
import type {
  Item,
  PlateConfig,
  CutConfig,
  Plate,
  Placement,
  FreeSpace,
  CalculationResult,
  SkippedItem,
} from '@/types'
import { preprocessItems } from './sort'
import { decideRotation } from './placement'
import { splitSpace } from './space'
import { calculateYield, calculateAverageYield } from './yield'
import { groupPatterns, getTotalPlatesFromPatterns } from './pattern'

/**
 * 新しい元板を作成する
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 新しい元板
 */
function createNewPlate(plateConfig: PlateConfig, cutConfig: CutConfig): Plate {
  // 有効エリアを初期スペースとして設定
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2

  return {
    id: uuidv4(),
    placements: [],
    yield: 0,
    usedArea: 0,
    freeSpaces: [
      {
        x: cutConfig.margin,
        y: cutConfig.margin,
        width: effectiveWidth,
        height: effectiveHeight,
      },
    ],
  }
}

/**
 * 製品を元板に配置する
 *
 * @param plate 元板
 * @param item 製品
 * @param space 配置する空きスペース
 * @param rotated 90度回転するか
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 */
function placeItem(
  plate: Plate,
  item: Item,
  space: FreeSpace,
  rotated: boolean,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): void {
  const width = rotated ? item.height : item.width
  const height = rotated ? item.width : item.height

  // 配置情報を作成
  const placement: Placement = {
    item,
    x: space.x,
    y: space.y,
    width,
    height,
    rotated,
  }

  // 元板に配置を追加
  plate.placements.push(placement)

  // 使用面積を更新
  plate.usedArea += item.width * item.height

  // 空きスペースを更新
  const newSpaces = splitSpace(space, placement, cutConfig)

  // 使用したスペースを削除
  plate.freeSpaces = plate.freeSpaces.filter((s) => s !== space)

  // 新しい空きスペースを追加
  plate.freeSpaces.push(...newSpaces)

  // 歩留まりを再計算
  plate.yield = calculateYield(plate, plateConfig, cutConfig)
}

/**
 * 製品を現在の元板に配置を試みる
 *
 * @param plate 元板
 * @param item 製品
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns 配置できたかどうか
 */
function tryPlaceItem(
  plate: Plate,
  item: Item,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): boolean {
  // 空きスペースを面積順にソート（大きい順）
  const sortedSpaces = [...plate.freeSpaces].sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    return areaB - areaA
  })

  // 各空きスペースに配置を試みる
  for (const space of sortedSpaces) {
    const result = decideRotation(item, space, cutConfig)

    if (result.canPlace) {
      placeItem(plate, item, space, result.rotated, plateConfig, cutConfig)
      return true
    }
  }

  return false
}

/**
 * 入力データのバリデーション
 * 元板より大きい製品を検出
 *
 * @param items 製品リスト
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @returns バリデーション結果
 */
function validateItems(
  items: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): { validItems: Item[]; skippedItems: SkippedItem[] } {
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2

  const validItems: Item[] = []
  const skippedItems: SkippedItem[] = []

  for (const item of items) {
    // 回転なし・回転ありの両方で元板より大きいかチェック
    const fitsWithoutRotation = item.width <= effectiveWidth && item.height <= effectiveHeight
    const fitsWithRotation = item.height <= effectiveWidth && item.width <= effectiveHeight

    if (!fitsWithoutRotation && !fitsWithRotation) {
      skippedItems.push({
        itemId: item.id,
        itemName: item.name,
        reason: 'TOO_LARGE',
        message: `製品「${item.name}」(${item.width}×${item.height}mm)は元板(${effectiveWidth}×${effectiveHeight}mm)より大きいため計算できません。`,
      })
    } else {
      validItems.push(item)
    }
  }

  return { validItems, skippedItems }
}

/**
 * Guillotine Cut + First Fit Decreasing アルゴリズムで配置計算
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @returns 計算結果
 */
export function calculate(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[]
): CalculationResult {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 前処理: 個数分に展開 + 面積順ソート
  const sortedItems = preprocessItems(validItems)

  const plates: Plate[] = []
  let currentPlate = createNewPlate(plateConfig, cutConfig)

  // 各製品を配置
  for (const item of sortedItems) {
    const placed = tryPlaceItem(currentPlate, item, plateConfig, cutConfig)

    if (!placed) {
      // 配置できなかった場合、次の元板へ
      plates.push(currentPlate)
      currentPlate = createNewPlate(plateConfig, cutConfig)

      // 新しい元板に配置を試みる
      const placedInNewPlate = tryPlaceItem(currentPlate, item, plateConfig, cutConfig)

      if (!placedInNewPlate) {
        // 新しい元板にも配置できない場合はエラー
        throw new Error(`製品「${item.name}」を配置できませんでした。`)
      }
    }
  }

  // 最後の元板を追加
  if (currentPlate.placements.length > 0) {
    plates.push(currentPlate)
  }

  // パターングループ化
  const patterns = groupPatterns(plates)

  // 統計情報の計算
  const totalPlates = getTotalPlatesFromPatterns(patterns)
  const averageYield = calculateAverageYield(plates)
  const totalCost = totalPlates * plateConfig.unitPrice

  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}
