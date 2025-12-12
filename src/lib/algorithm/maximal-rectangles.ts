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
import {
  groupItemsBySize,
  calculateOptimalGrid,
  extractUngroupedItems,
  type GridGroup,
} from './grid-grouping'

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
 * 配置済みグリッド
 */
interface PlacedGrid {
  grid: GridGroup
  x: number
  y: number
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
 * 最適化目標の種類
 */
export type OptimizationGoal = 'yield' | 'remaining-space'

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
 * グリッドを配置して矩形を分割
 */
function placeGridAndSplit(
  freeRectangles: FreeRectangle[],
  placements: PlacedItem[],
  grid: GridGroup,
  rect: FreeRectangle,
  cutWidth: number
): FreeRectangle[] {
  // グリッド内の各アイテムの配置を計算
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const itemIndex = row * grid.cols + col
      if (itemIndex >= grid.items.length) break

      const item = grid.items[itemIndex]

      // グリッド内の相対位置を計算
      const relativeX = col * (grid.itemWidth + cutWidth)
      const relativeY = row * (grid.itemHeight + cutWidth)

      // 元板上の絶対位置を計算
      const absoluteX = rect.x + relativeX
      const absoluteY = rect.y + relativeY

      // 配置情報を記録
      placements.push({
        item,
        x: absoluteX,
        y: absoluteY,
        width: grid.itemWidth,
        height: grid.itemHeight,
        rotated: grid.rotated,
      })
    }
  }

  // 新しい空き矩形のリストを生成
  const newFreeRectangles: FreeRectangle[] = []

  // 各既存の空き矩形について、配置したグリッドと重なる部分を分割
  for (const free of freeRectangles) {
    // 重なりがない場合はそのまま残す
    if (
      !isOverlapping(free, rect.x, rect.y, grid.totalWidth + cutWidth, grid.totalHeight + cutWidth)
    ) {
      newFreeRectangles.push(free)
      continue
    }

    // 重なる場合、最大4つの新しい矩形に分割
    const splits = splitRectangle(
      free,
      rect.x,
      rect.y,
      grid.totalWidth + cutWidth,
      grid.totalHeight + cutWidth
    )
    newFreeRectangles.push(...splits)
  }

  // 重複する矩形を削除
  return removeDuplicates(newFreeRectangles)
}

/**
 * 残りアイテムから同じサイズのアイテムを探す
 */
function findSameSizeItems(
  targetItem: Item,
  remainingItems: Item[],
  maxCount: number = 100
): Item[] {
  const sameSizeItems: Item[] = []

  for (const item of remainingItems) {
    if (item.width === targetItem.width && item.height === targetItem.height) {
      sameSizeItems.push(item)
      if (sameSizeItems.length >= maxCount) break
    }
  }

  return sameSizeItems
}

/**
 * 空き矩形に収まるグリッドを動的に生成
 */
function tryCreateDynamicGrid(
  targetItem: Item,
  remainingItems: Item[],
  freeRectangle: FreeRectangle,
  cutWidth: number,
  minGridSize: number = 4,
  optimizationGoal: OptimizationGoal = 'yield'
): GridGroup | null {
  // 同じサイズのアイテムを探す
  const sameSizeItems = findSameSizeItems(targetItem, remainingItems)

  if (sameSizeItems.length < minGridSize) {
    return null // グリッドを作るには少なすぎる
  }

  // 空き矩形に収まるグリッド候補を探す
  const candidates: GridGroup[] = []

  // 様々なグリッドサイズを試す（2×2, 2×3, 3×2, 2×4, 4×2, 3×3など）
  for (let rows = 2; rows <= 5; rows++) {
    for (let cols = 2; cols <= 5; cols++) {
      const gridItemCount = Math.min(rows * cols, sameSizeItems.length)

      if (gridItemCount < minGridSize) continue

      // 通常の向きと回転の両方を試す
      for (const rotated of [false, true]) {
        const itemWidth = rotated ? targetItem.height : targetItem.width
        const itemHeight = rotated ? targetItem.width : targetItem.height

        const totalWidth = cols * itemWidth + (cols - 1) * cutWidth
        const totalHeight = rows * itemHeight + (rows - 1) * cutWidth

        // 空き矩形に収まるかチェック
        if (
          totalWidth + cutWidth <= freeRectangle.width &&
          totalHeight + cutWidth <= freeRectangle.height
        ) {
          candidates.push({
            id: `dynamic-grid-${rows}x${cols}`,
            items: sameSizeItems.slice(0, gridItemCount),
            itemWidth,
            itemHeight,
            rows,
            cols,
            totalWidth,
            totalHeight,
            rotated,
          })
        }
      }
    }
  }

  if (candidates.length === 0) return null

  // 最適化目標に応じてグリッドを選択
  if (optimizationGoal === 'remaining-space') {
    // 余りスペース優先: 正方形に近いグリッドを優先
    candidates.sort((a, b) => {
      // グリッドのアスペクト比を計算
      const aspectRatioA = Math.max(a.rows, a.cols) / Math.min(a.rows, a.cols)
      const aspectRatioB = Math.max(b.rows, b.cols) / Math.min(b.rows, b.cols)

      // アスペクト比が小さい（正方形に近い）方を優先
      if (Math.abs(aspectRatioA - aspectRatioB) > 0.1) {
        return aspectRatioA - aspectRatioB
      }

      // アスペクト比が同じなら、配置できるアイテム数が多い方を優先
      return b.items.length - a.items.length
    })
  } else {
    // 歩留まり優先: 最も多くのアイテムを配置できるグリッドを選択
    candidates.sort((a, b) => b.items.length - a.items.length)
  }

  return candidates[0]
}

/**
 * グリッドを配置できる最適な矩形を見つける
 */
function findBestRectangleForGrid(
  grid: GridGroup,
  freeRectangles: FreeRectangle[],
  cutWidth: number,
  heuristic: Heuristic
): FreeRectangle | null {
  // グリッドが収まる矩形をフィルタ
  const validRects = freeRectangles.filter((rect) => {
    return grid.totalWidth + cutWidth <= rect.width && grid.totalHeight + cutWidth <= rect.height
  })

  if (validRects.length === 0) return null

  // ヒューリスティックに応じて最適な矩形を選択
  switch (heuristic) {
    case 'best-short-side-fit': {
      let bestRect: FreeRectangle | null = null
      let bestShortSideFit = Infinity
      let bestLongSideFit = Infinity

      for (const rect of validRects) {
        const leftoverHorizontal = rect.width - (grid.totalWidth + cutWidth)
        const leftoverVertical = rect.height - (grid.totalHeight + cutWidth)
        const shortSideFit = Math.min(leftoverHorizontal, leftoverVertical)
        const longSideFit = Math.max(leftoverHorizontal, leftoverVertical)

        if (
          shortSideFit < bestShortSideFit ||
          (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)
        ) {
          bestRect = rect
          bestShortSideFit = shortSideFit
          bestLongSideFit = longSideFit
        }
      }
      return bestRect
    }

    case 'best-long-side-fit': {
      let bestRect: FreeRectangle | null = null
      let bestLongSideFit = Infinity
      let bestShortSideFit = Infinity

      for (const rect of validRects) {
        const leftoverHorizontal = rect.width - (grid.totalWidth + cutWidth)
        const leftoverVertical = rect.height - (grid.totalHeight + cutWidth)
        const longSideFit = Math.max(leftoverHorizontal, leftoverVertical)
        const shortSideFit = Math.min(leftoverHorizontal, leftoverVertical)

        if (
          longSideFit < bestLongSideFit ||
          (longSideFit === bestLongSideFit && shortSideFit < bestShortSideFit)
        ) {
          bestRect = rect
          bestLongSideFit = longSideFit
          bestShortSideFit = shortSideFit
        }
      }
      return bestRect
    }

    case 'best-area-fit': {
      let bestRect: FreeRectangle | null = null
      let bestAreaFit = Infinity

      for (const rect of validRects) {
        const areaFit =
          rect.width * rect.height - (grid.totalWidth + cutWidth) * (grid.totalHeight + cutWidth)

        if (areaFit < bestAreaFit) {
          bestRect = rect
          bestAreaFit = areaFit
        }
      }
      return bestRect
    }

    case 'bottom-left': {
      let bestRect: FreeRectangle | null = null
      let bestY = -1
      let bestX = Infinity

      for (const rect of validRects) {
        if (rect.y > bestY || (rect.y === bestY && rect.x < bestX)) {
          bestRect = rect
          bestY = rect.y
          bestX = rect.x
        }
      }
      return bestRect
    }
  }
}

/**
 * 新しい元板を作成する
 */
function createNewPlate(
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): {
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
 * 余りスペースの品質を計算
 *
 * 以下の3つの要素で評価：
 * 1. 集約度：矩形の数が少ないほど良い
 * 2. 形状：最大矩形が正方形に近いほど良い
 * 3. サイズ：最大矩形が大きいほど良い
 */
function calculateRemainingSpaceQuality(freeRectangles: FreeRectangle[]): number {
  if (freeRectangles.length === 0) return 1 // 余りスペースなし = 最高

  // 総面積を計算
  const totalArea = freeRectangles.reduce((sum, rect) => {
    return sum + rect.width * rect.height
  }, 0)

  if (totalArea === 0) return 1

  // 最大矩形を取得
  const maxRect = freeRectangles.reduce((max, rect) =>
    rect.width * rect.height > max.width * max.height ? rect : max
  )
  const maxRectArea = maxRect.width * maxRect.height

  // 1. 集約度スコア：矩形の数が少ないほど良い（1 / (1 + 矩形数 * 0.2)）
  const concentrationScore = 1 / (1 + freeRectangles.length * 0.2)

  // 2. 形状スコア：正方形に近いほど良い
  const aspectRatio =
    Math.max(maxRect.width, maxRect.height) / Math.min(maxRect.width, maxRect.height)
  const shapeScore = 1 / aspectRatio // 1に近いほど正方形

  // 3. サイズスコア：最大矩形が総面積に占める割合
  const sizeScore = maxRectArea / totalArea

  // 総合スコア（各要素を重み付けして合計）
  // 集約度: 40%, 形状: 30%, サイズ: 30%
  return concentrationScore * 0.4 + shapeScore * 0.3 + sizeScore * 0.3
}

/**
 * 全元板の余りスペース品質の平均を計算
 */
function calculateAverageRemainingSpaceQuality(
  plates: Array<{ freeRectangles: FreeRectangle[] }>
): number {
  if (plates.length === 0) return 0

  const totalQuality = plates.reduce((sum, plate) => {
    return sum + calculateRemainingSpaceQuality(plate.freeRectangles)
  }, 0)

  return totalQuality / plates.length
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
 * 計算結果に余りスペース品質を含める拡張型
 */
interface CalculationResultWithQuality extends CalculationResult {
  remainingSpaceQuality: number
}

/**
 * 指定されたヒューリスティックでMaximal Rectangles アルゴリズムを実行
 */
function calculateMaximalRectanglesWithHeuristic(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  heuristic: Heuristic,
  optimizationGoal: OptimizationGoal,
  useGridGrouping: boolean = true
): CalculationResultWithQuality {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 前処理: 個数分に展開 + 面積順ソート
  const expanded = expandItems(validItems)
  const sortedItems = sortByArea(expanded)

  // 残りアイテムのリスト（配置済みアイテムを除外していく）
  let remainingItems = [...sortedItems]

  const plates: Array<{
    id: string
    placements: PlacedItem[]
    freeRectangles: FreeRectangle[]
    yield: number
  }> = []

  let currentPlate = createNewPlate(plateConfig, cutConfig)

  // アイテムを配置（動的グリッド生成）
  while (remainingItems.length > 0) {
    const currentItem = remainingItems[0]
    let placed = false

    // グリッドグルーピングが有効な場合、動的にグリッドを試みる
    if (useGridGrouping) {
      // 最適化目標に応じて空き矩形をソート
      const sortedRects = [...currentPlate.freeRectangles].sort((a, b) => {
        if (optimizationGoal === 'remaining-space') {
          // 余りスペース優先: 左下寄せ（Y座標が大きい > X座標が小さい）
          if (a.y !== b.y) return b.y - a.y // 下側を優先
          return a.x - b.x // 左側を優先
        } else {
          // 歩留まり優先: 面積が大きい順
          return b.width * b.height - a.width * a.height
        }
      })

      for (const rect of sortedRects) {
        // この空き矩形に収まるグリッドを動的に生成
        const grid = tryCreateDynamicGrid(
          currentItem,
          remainingItems,
          rect,
          cutConfig.cutWidth,
          4, // 最小4個からグリッド化
          optimizationGoal
        )

        if (grid) {
          // グリッドを配置
          currentPlate.freeRectangles = placeGridAndSplit(
            currentPlate.freeRectangles,
            currentPlate.placements,
            grid,
            rect,
            cutConfig.cutWidth
          )

          // 配置したアイテムを残りリストから削除
          const placedIds = new Set(grid.items.map((item) => item.id))
          remainingItems = remainingItems.filter((item) => !placedIds.has(item.id))

          placed = true
          break
        }
      }
    }

    // グリッドが作れなかった、またはグリッド無効の場合は個別配置
    if (!placed) {
      const result = findBestRectangle(
        currentItem,
        currentPlate.freeRectangles,
        cutConfig.cutWidth,
        heuristic
      )

      if (result) {
        // 配置可能な場合
        currentPlate.freeRectangles = placeItemAndSplit(
          currentPlate.freeRectangles,
          currentPlate.placements,
          currentItem,
          result.rect,
          result.rotated,
          cutConfig.cutWidth
        )

        // 配置したアイテムを削除
        remainingItems = remainingItems.filter((item) => item.id !== currentItem.id)
        placed = true
      } else {
        // 配置できない場合、既存の全元板に配置を試みる
        let placedInExistingPlate = false

        for (const existingPlate of plates) {
          const existingResult = findBestRectangle(
            currentItem,
            existingPlate.freeRectangles,
            cutConfig.cutWidth,
            heuristic
          )

          if (existingResult) {
            // 既存の元板に配置可能
            existingPlate.freeRectangles = placeItemAndSplit(
              existingPlate.freeRectangles,
              existingPlate.placements,
              currentItem,
              existingResult.rect,
              existingResult.rotated,
              cutConfig.cutWidth
            )

            remainingItems = remainingItems.filter((item) => item.id !== currentItem.id)
            placedInExistingPlate = true
            break
          }
        }

        // 既存の元板にも配置できない場合、現在の元板を保存して新しい元板へ
        if (!placedInExistingPlate) {
          plates.push(currentPlate)
          currentPlate = createNewPlate(plateConfig, cutConfig)

          // 新しい元板に配置を試みる（グリッド優先）
          let placedInNewPlate = false

          if (useGridGrouping) {
            const sortedRects = [...currentPlate.freeRectangles].sort((a, b) => {
              if (optimizationGoal === 'remaining-space') {
                // 余りスペース優先: 左下寄せ
                if (a.y !== b.y) return b.y - a.y
                return a.x - b.x
              } else {
                // 歩留まり優先: 面積が大きい順
                return b.width * b.height - a.width * a.height
              }
            })

            for (const rect of sortedRects) {
              const grid = tryCreateDynamicGrid(
                currentItem,
                remainingItems,
                rect,
                cutConfig.cutWidth,
                4,
                optimizationGoal
              )

              if (grid) {
                currentPlate.freeRectangles = placeGridAndSplit(
                  currentPlate.freeRectangles,
                  currentPlate.placements,
                  grid,
                  rect,
                  cutConfig.cutWidth
                )

                const placedIds = new Set(grid.items.map((item) => item.id))
                remainingItems = remainingItems.filter((item) => !placedIds.has(item.id))

                placedInNewPlate = true
                break
              }
            }
          }

          // グリッドが作れなかった場合は個別配置
          if (!placedInNewPlate) {
            const newResult = findBestRectangle(
              currentItem,
              currentPlate.freeRectangles,
              cutConfig.cutWidth,
              heuristic
            )

            if (!newResult) {
              // 新しい元板にも配置できない場合はエラー
              throw new Error(
                `製品「${currentItem.name}」を配置できませんでした。元板サイズまたは切断設定を確認してください。`
              )
            }

            currentPlate.freeRectangles = placeItemAndSplit(
              currentPlate.freeRectangles,
              currentPlate.placements,
              currentItem,
              newResult.rect,
              newResult.rotated,
              cutConfig.cutWidth
            )

            remainingItems = remainingItems.filter((item) => item.id !== currentItem.id)
          }
        }
      }
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

  // 余りスペース品質を計算
  const remainingSpaceQuality = calculateAverageRemainingSpaceQuality(plates)

  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
    remainingSpaceQuality,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}

/**
 * Maximal Rectangles アルゴリズムで配置計算（複数のヒューリスティックを自動試行）
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @param optimizationGoal 最適化目標（デフォルト: yield）
 * @param useGridGrouping グリッドグルーピングを使用するかどうか（デフォルト: false）
 */
export function calculateMaximalRectangles(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  optimizationGoal: OptimizationGoal = 'yield',
  useGridGrouping: boolean = false
): CalculationResult {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 最適化目標に応じてヒューリスティックの順序を変更
  const heuristics: Heuristic[] =
    optimizationGoal === 'remaining-space'
      ? [
          // 余りスペース優先: Bottom-Leftを最優先（左下詰めで余白を右上にまとめる）
          'bottom-left',
          'best-area-fit',
          'best-long-side-fit',
          'best-short-side-fit',
        ]
      : [
          // 歩留まり優先: 従来通り
          'best-short-side-fit',
          'best-long-side-fit',
          'best-area-fit',
          'bottom-left',
        ]

  let bestResult: CalculationResultWithQuality | null = null

  // 各ヒューリスティックを試す
  for (const heuristic of heuristics) {
    try {
      const result = calculateMaximalRectanglesWithHeuristic(
        plateConfig,
        cutConfig,
        validItems,
        heuristic,
        optimizationGoal,
        useGridGrouping
      )

      // 最適化目標に応じてスコアを計算
      const isBetter = (() => {
        if (!bestResult) return true

        // 常に元板枚数が少ない方を優先
        if (result.totalPlates < bestResult.totalPlates) return true
        if (result.totalPlates > bestResult.totalPlates) return false

        // 枚数が同じ場合、最適化目標に応じて判定
        switch (optimizationGoal) {
          case 'yield':
            // 歩留まり優先
            return result.averageYield > bestResult.averageYield

          case 'remaining-space':
            // 余りスペース品質優先
            return result.remainingSpaceQuality > bestResult.remainingSpaceQuality
        }
      })()

      if (isBetter) {
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

  // remainingSpaceQualityを除外してCalculationResult型として返す
  const { remainingSpaceQuality, ...finalResult } = bestResult

  // スキップされたアイテムを追加
  return {
    ...finalResult,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}
