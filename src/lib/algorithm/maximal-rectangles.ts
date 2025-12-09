/**
 * Maximal Rectangles アルゴリズム
 *
 * ギロチンカットの制約を外し、より柔軟な配置を実現する。
 * L字型などの複雑な空きスペースを複数の矩形で表現し、活用する。
 */

import type {
  Item,
  PlateConfig,
  CutConfig,
  Plate,
  Placement,
  CalculationResult,
  SkippedItem,
} from '@/types'
import { expandItems, sortByArea } from './sort'
import { calculateYield, calculateAverageYield } from './yield'
import { groupPatterns, getTotalPlatesFromPatterns } from './pattern'

/**
 * 空き矩形（Free Rectangle）
 */
interface FreeRectangle {
  x: number // 左上X座標
  y: number // 左上Y座標
  width: number // 幅
  height: number // 高さ
}

/**
 * 配置済み製品
 */
interface PlacedItem {
  item: Item
  x: number
  y: number
  width: number // 配置時の幅（回転考慮済み）
  height: number // 配置時の高さ（回転考慮済み）
  rotated: boolean
}

/**
 * 2つの矩形が重なっているかチェック
 */
function isOverlapping(
  rect: FreeRectangle,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return !(
    rect.x >= x + width ||
    rect.x + rect.width <= x ||
    rect.y >= y + height ||
    rect.y + rect.height <= y
  )
}

/**
 * 矩形を分割する
 *
 * 配置した製品と重なる空き矩形を最大4つの新しい矩形に分割
 */
function splitRectangle(
  rect: FreeRectangle,
  placedX: number,
  placedY: number,
  placedWidth: number,
  placedHeight: number
): FreeRectangle[] {
  const splits: FreeRectangle[] = []

  // 右側の空きスペース
  if (placedX + placedWidth < rect.x + rect.width) {
    splits.push({
      x: placedX + placedWidth,
      y: rect.y,
      width: rect.x + rect.width - (placedX + placedWidth),
      height: rect.height,
    })
  }

  // 下側の空きスペース
  if (placedY + placedHeight < rect.y + rect.height) {
    splits.push({
      x: rect.x,
      y: placedY + placedHeight,
      width: rect.width,
      height: rect.y + rect.height - (placedY + placedHeight),
    })
  }

  // 左側の空きスペース
  if (placedX > rect.x) {
    splits.push({
      x: rect.x,
      y: rect.y,
      width: placedX - rect.x,
      height: rect.height,
    })
  }

  // 上側の空きスペース
  if (placedY > rect.y) {
    splits.push({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: placedY - rect.y,
    })
  }

  return splits
}

/**
 * 重複する矩形を削除
 *
 * 他の矩形に完全に含まれる矩形を削除する
 */
function removeDuplicates(rectangles: FreeRectangle[]): FreeRectangle[] {
  const result: FreeRectangle[] = []

  for (let i = 0; i < rectangles.length; i++) {
    const rect = rectangles[i]
    let isContained = false

    // 他の矩形に完全に含まれているかチェック
    for (let j = 0; j < rectangles.length; j++) {
      if (i === j) continue

      const other = rectangles[j]

      if (
        rect.x >= other.x &&
        rect.y >= other.y &&
        rect.x + rect.width <= other.x + other.width &&
        rect.y + rect.height <= other.y + other.height
      ) {
        isContained = true
        break
      }
    }

    if (!isContained) {
      result.push(rect)
    }
  }

  return result
}

/**
 * 製品が空き矩形に配置可能かチェック
 */
function canPlaceInRectangle(
  item: Item,
  rect: FreeRectangle,
  cutWidth: number
): { canPlace: boolean; rotated: boolean } {
  const itemWidthWithCut = item.width + cutWidth
  const itemHeightWithCut = item.height + cutWidth

  // 回転なしで配置可能か
  if (itemWidthWithCut <= rect.width && itemHeightWithCut <= rect.height) {
    return { canPlace: true, rotated: false }
  }

  // 回転ありで配置可能か
  if (itemHeightWithCut <= rect.width && itemWidthWithCut <= rect.height) {
    return { canPlace: true, rotated: true }
  }

  return { canPlace: false, rotated: false }
}

/**
 * ヒューリスティックの種類
 */
type Heuristic = 'best-short-side-fit' | 'best-long-side-fit' | 'best-area-fit' | 'bottom-left'

/**
 * Best Short Side Fit: 短辺の余りが最小の矩形を選択
 */
function findBestRectangleShortSide(
  item: Item,
  freeRectangles: FreeRectangle[],
  cutWidth: number
): { rect: FreeRectangle; rotated: boolean } | null {
  let bestRect: FreeRectangle | null = null
  let bestRotated = false
  let bestShortSideFit = Infinity
  let bestLongSideFit = Infinity

  for (const rect of freeRectangles) {
    const result = canPlaceInRectangle(item, rect, cutWidth)
    if (!result.canPlace) continue

    const width = result.rotated ? item.height : item.width
    const height = result.rotated ? item.width : item.height

    const leftoverHorizontal = rect.width - (width + cutWidth)
    const leftoverVertical = rect.height - (height + cutWidth)
    const shortSideFit = Math.min(leftoverHorizontal, leftoverVertical)
    const longSideFit = Math.max(leftoverHorizontal, leftoverVertical)

    if (
      shortSideFit < bestShortSideFit ||
      (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)
    ) {
      bestRect = rect
      bestRotated = result.rotated
      bestShortSideFit = shortSideFit
      bestLongSideFit = longSideFit
    }
  }

  if (!bestRect) return null
  return { rect: bestRect, rotated: bestRotated }
}

/**
 * Best Long Side Fit: 長辺の余りが最小の矩形を選択
 */
function findBestRectangleLongSide(
  item: Item,
  freeRectangles: FreeRectangle[],
  cutWidth: number
): { rect: FreeRectangle; rotated: boolean } | null {
  let bestRect: FreeRectangle | null = null
  let bestRotated = false
  let bestLongSideFit = Infinity
  let bestShortSideFit = Infinity

  for (const rect of freeRectangles) {
    const result = canPlaceInRectangle(item, rect, cutWidth)
    if (!result.canPlace) continue

    const width = result.rotated ? item.height : item.width
    const height = result.rotated ? item.width : item.height

    const leftoverHorizontal = rect.width - (width + cutWidth)
    const leftoverVertical = rect.height - (height + cutWidth)
    const longSideFit = Math.max(leftoverHorizontal, leftoverVertical)
    const shortSideFit = Math.min(leftoverHorizontal, leftoverVertical)

    if (
      longSideFit < bestLongSideFit ||
      (longSideFit === bestLongSideFit && shortSideFit < bestShortSideFit)
    ) {
      bestRect = rect
      bestRotated = result.rotated
      bestLongSideFit = longSideFit
      bestShortSideFit = shortSideFit
    }
  }

  if (!bestRect) return null
  return { rect: bestRect, rotated: bestRotated }
}

/**
 * Best Area Fit: 面積の余りが最小の矩形を選択
 */
function findBestRectangleArea(
  item: Item,
  freeRectangles: FreeRectangle[],
  cutWidth: number
): { rect: FreeRectangle; rotated: boolean } | null {
  let bestRect: FreeRectangle | null = null
  let bestRotated = false
  let bestAreaFit = Infinity

  for (const rect of freeRectangles) {
    const result = canPlaceInRectangle(item, rect, cutWidth)
    if (!result.canPlace) continue

    const width = result.rotated ? item.height : item.width
    const height = result.rotated ? item.width : item.height

    const areaFit = rect.width * rect.height - (width + cutWidth) * (height + cutWidth)

    if (areaFit < bestAreaFit) {
      bestRect = rect
      bestRotated = result.rotated
      bestAreaFit = areaFit
    }
  }

  if (!bestRect) return null
  return { rect: bestRect, rotated: bestRotated }
}

/**
 * Bottom Left: 左下優先（Y座標が大きい > X座標が小さい）
 */
function findBestRectangleBottomLeft(
  item: Item,
  freeRectangles: FreeRectangle[],
  cutWidth: number
): { rect: FreeRectangle; rotated: boolean } | null {
  let bestRect: FreeRectangle | null = null
  let bestRotated = false
  let bestY = -1
  let bestX = Infinity

  for (const rect of freeRectangles) {
    const result = canPlaceInRectangle(item, rect, cutWidth)
    if (!result.canPlace) continue

    // Y座標が大きい（下側）を優先、同じならX座標が小さい（左側）を優先
    if (rect.y > bestY || (rect.y === bestY && rect.x < bestX)) {
      bestRect = rect
      bestRotated = result.rotated
      bestY = rect.y
      bestX = rect.x
    }
  }

  if (!bestRect) return null
  return { rect: bestRect, rotated: bestRotated }
}

/**
 * ヒューリスティックに応じて最適な矩形を選択
 */
function findBestRectangle(
  item: Item,
  freeRectangles: FreeRectangle[],
  cutWidth: number,
  heuristic: Heuristic
): { rect: FreeRectangle; rotated: boolean } | null {
  switch (heuristic) {
    case 'best-short-side-fit':
      return findBestRectangleShortSide(item, freeRectangles, cutWidth)
    case 'best-long-side-fit':
      return findBestRectangleLongSide(item, freeRectangles, cutWidth)
    case 'best-area-fit':
      return findBestRectangleArea(item, freeRectangles, cutWidth)
    case 'bottom-left':
      return findBestRectangleBottomLeft(item, freeRectangles, cutWidth)
  }
}

/**
 * 製品を配置して矩形を分割
 */
function placeItemAndSplit(
  freeRectangles: FreeRectangle[],
  placements: PlacedItem[],
  item: Item,
  rect: FreeRectangle,
  rotated: boolean,
  cutWidth: number
): FreeRectangle[] {
  const width = rotated ? item.height : item.width
  const height = rotated ? item.width : item.height

  // 配置情報を記録
  placements.push({
    item,
    x: rect.x,
    y: rect.y,
    width,
    height,
    rotated,
  })

  // 新しい空き矩形のリストを生成
  const newFreeRectangles: FreeRectangle[] = []

  // 各既存の空き矩形について、配置した製品と重なる部分を分割
  for (const free of freeRectangles) {
    // 重なりがない場合はそのまま残す
    if (!isOverlapping(free, rect.x, rect.y, width + cutWidth, height + cutWidth)) {
      newFreeRectangles.push(free)
      continue
    }

    // 重なる場合、最大4つの新しい矩形に分割
    const splits = splitRectangle(free, rect.x, rect.y, width + cutWidth, height + cutWidth)
    newFreeRectangles.push(...splits)
  }

  // 重複する矩形を削除（重要な最適化）
  return removeDuplicates(newFreeRectangles)
}

/**
 * 新しい元板を作成する
 */
function createNewPlate(plateConfig: PlateConfig, cutConfig: CutConfig): {
  id: string
  placements: PlacedItem[]
  freeRectangles: FreeRectangle[]
  yield: number
} {
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2

  return {
    id: `plate-${Date.now()}-${Math.random()}`,
    placements: [],
    freeRectangles: [
      {
        x: cutConfig.margin,
        y: cutConfig.margin,
        width: effectiveWidth,
        height: effectiveHeight,
      },
    ],
    yield: 0,
  }
}

/**
 * PlacedItemをPlacement型に変換
 */
function convertToPlacement(placedItem: PlacedItem): Placement {
  return {
    item: placedItem.item,
    x: placedItem.x,
    y: placedItem.y,
    width: placedItem.width,
    height: placedItem.height,
    rotated: placedItem.rotated,
  }
}

/**
 * 元板より大きい製品を検出
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
    const fitsWithoutRotation =
      item.width + cutConfig.cutWidth <= effectiveWidth &&
      item.height + cutConfig.cutWidth <= effectiveHeight

    const fitsWithRotation =
      item.height + cutConfig.cutWidth <= effectiveWidth &&
      item.width + cutConfig.cutWidth <= effectiveHeight

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
 * 指定されたヒューリスティックでMaximal Rectangles アルゴリズムを実行
 */
function calculateMaximalRectanglesWithHeuristic(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  heuristic: Heuristic
): CalculationResult {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 前処理: 個数分に展開 + 面積順ソート
  const expanded = expandItems(validItems)
  const sortedItems = sortByArea(expanded)

  const plates: Array<{
    id: string
    placements: PlacedItem[]
    freeRectangles: FreeRectangle[]
    yield: number
  }> = []

  let currentPlate = createNewPlate(plateConfig, cutConfig)

  // 各製品を配置
  for (const item of sortedItems) {
    const result = findBestRectangle(
      item,
      currentPlate.freeRectangles,
      cutConfig.cutWidth,
      heuristic
    )

    if (result) {
      // 配置可能な場合
      currentPlate.freeRectangles = placeItemAndSplit(
        currentPlate.freeRectangles,
        currentPlate.placements,
        item,
        result.rect,
        result.rotated,
        cutConfig.cutWidth
      )
    } else {
      // 配置できない場合、現在の元板を保存して新しい元板へ
      plates.push(currentPlate)
      currentPlate = createNewPlate(plateConfig, cutConfig)

      // 新しい元板に配置を試みる
      const newResult = findBestRectangle(
        item,
        currentPlate.freeRectangles,
        cutConfig.cutWidth,
        heuristic
      )

      if (!newResult) {
        // 新しい元板にも配置できない場合はエラー
        throw new Error(
          `製品「${item.name}」を配置できませんでした。元板サイズまたは切断設定を確認してください。`
        )
      }

      currentPlate.freeRectangles = placeItemAndSplit(
        currentPlate.freeRectangles,
        currentPlate.placements,
        item,
        newResult.rect,
        newResult.rotated,
        cutConfig.cutWidth
      )
    }
  }

  // 最後の元板を追加
  if (currentPlate.placements.length > 0) {
    plates.push(currentPlate)
  }

  // Plate型に変換して歩留まりと使用面積を計算
  const finalPlates: Plate[] = plates.map((plate) => {
    const placements = plate.placements.map(convertToPlacement)

    // 使用面積を計算
    const usedArea = placements.reduce((sum, placement) => {
      return sum + placement.width * placement.height
    }, 0)

    return {
      id: plate.id,
      placements,
      freeSpaces: [], // Maximal Rectanglesでは使用しない
      yield: 0,
      usedArea,
    }
  })

  // 歩留まりを計算
  finalPlates.forEach((plate) => {
    plate.yield = calculateYield(plate, plateConfig, cutConfig)
  })

  // パターンのグループ化
  const patterns = groupPatterns(finalPlates)
  const totalPlates = getTotalPlatesFromPatterns(patterns)
  const averageYield = calculateAverageYield(finalPlates)
  const totalCost = totalPlates * plateConfig.unitPrice

  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}

/**
 * Maximal Rectangles アルゴリズムで配置計算（複数のヒューリスティックを自動試行）
 */
export function calculateMaximalRectangles(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[]
): CalculationResult {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 試すヒューリスティック
  const heuristics: Heuristic[] = [
    'best-short-side-fit',
    'best-long-side-fit',
    'best-area-fit',
    'bottom-left',
  ]

  let bestResult: CalculationResult | null = null

  // 各ヒューリスティックを試す
  for (const heuristic of heuristics) {
    try {
      const result = calculateMaximalRectanglesWithHeuristic(
        plateConfig,
        cutConfig,
        validItems,
        heuristic
      )

      // 最良の結果を選択（枚数が少ない > 歩留まりが高い）
      if (
        !bestResult ||
        result.totalPlates < bestResult.totalPlates ||
        (result.totalPlates === bestResult.totalPlates &&
          result.averageYield > bestResult.averageYield)
      ) {
        bestResult = result
      }
    } catch (error) {
      // このヒューリスティックでは配置できなかった場合はスキップ
      continue
    }
  }

  if (!bestResult) {
    throw new Error('どのヒューリスティックでも配置できませんでした。')
  }

  // スキップされたアイテムを追加
  return {
    ...bestResult,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}
