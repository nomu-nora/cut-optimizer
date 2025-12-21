/**
 * 端材（余り材）配置アルゴリズム
 * v1.3で追加
 */

import type {
  OffcutPlate,
  OffcutUsageInfo,
  Item,
  PlateConfig,
  CutConfig,
  CalculationResult,
  PatternGroup,
  OffcutMode,
} from '@/types'
import { calculate, type OptimizationGoal } from './guillotine'

/**
 * 端材を面積の小さい順にソート
 */
export function sortOffcutsByArea(offcuts: OffcutPlate[]): OffcutPlate[] {
  return [...offcuts].sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    return areaA - areaB
  })
}

/**
 * グリッド配置を試す（明示的に複数個配置をテスト）
 */
function tryGridPlacements(
  item: Item,
  offcutWidth: number,
  offcutHeight: number,
  cutWidth: number
): { count: number; yield: number; cols: number; rows: number; rotated: boolean } | null {
  const offcutArea = offcutWidth * offcutHeight
  let bestPlacement: {
    count: number
    yield: number
    cols: number
    rows: number
    rotated: boolean
  } | null = null

  // 試すグリッドパターン（横×縦）
  const gridsToTry = [
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
    [3, 1],
    [1, 3],
    [3, 2],
    [2, 3],
    [3, 3],
    [4, 1],
    [1, 4],
    [4, 2],
    [2, 4],
    [3, 4],
    [4, 3],
    [4, 4],
  ]

  for (const [cols, rows] of gridsToTry) {
    // 回転なしで試す
    const widthNeeded = item.width * cols + cutWidth * (cols - 1)
    const heightNeeded = item.height * rows + cutWidth * (rows - 1)

    if (widthNeeded <= offcutWidth && heightNeeded <= offcutHeight) {
      const count = cols * rows
      const usedArea = item.width * item.height * count
      const yieldValue = (usedArea / offcutArea) * 100

      if (!bestPlacement || yieldValue > bestPlacement.yield) {
        bestPlacement = { count, yield: yieldValue, cols, rows, rotated: false }
      }
    }

    // 回転ありで試す（90度回転）
    const widthNeededRotated = item.height * cols + cutWidth * (cols - 1)
    const heightNeededRotated = item.width * rows + cutWidth * (rows - 1)

    if (widthNeededRotated <= offcutWidth && heightNeededRotated <= offcutHeight) {
      const count = cols * rows
      const usedArea = item.width * item.height * count
      const yieldValue = (usedArea / offcutArea) * 100

      if (!bestPlacement || yieldValue > bestPlacement.yield) {
        bestPlacement = { count, yield: yieldValue, cols, rows, rotated: true }
      }
    }
  }

  return bestPlacement
}

/**
 * グリッド配置から配置座標を生成
 */
function createGridPlacements(
  item: Item,
  gridResult: { count: number; yield: number; cols: number; rows: number; rotated: boolean },
  cutWidth: number
): import('@/types').Placement[] {
  const placements: import('@/types').Placement[] = []
  const itemWidth = gridResult.rotated ? item.height : item.width
  const itemHeight = gridResult.rotated ? item.width : item.height

  for (let row = 0; row < gridResult.rows; row++) {
    for (let col = 0; col < gridResult.cols; col++) {
      placements.push({
        item: item,
        x: col * (itemWidth + cutWidth),
        y: row * (itemHeight + cutWidth),
        width: itemWidth,
        height: itemHeight,
        rotated: gridResult.rotated,
      })
    }
  }

  return placements
}

/**
 * 端材用の製品検証（cutWidthを含めない）
 * 端材は既にカット済みなので、製品が入るかの検証だけを行う
 */
function validateItemsForOffcut(items: Item[], offcutWidth: number, offcutHeight: number): Item[] {
  return items.filter((item) => {
    // 回転なし・回転ありの両方で確認
    const fitsWithoutRotation = item.width <= offcutWidth && item.height <= offcutHeight
    const fitsWithRotation = item.height <= offcutWidth && item.width <= offcutHeight
    return fitsWithoutRotation || fitsWithRotation
  })
}

/**
 * 端材に製品を配置
 *
 * 端材を1枚ずつ小さい順に処理し、各端材に最も歩留まりの高い製品を配置する
 */
export function placeOnOffcuts(
  offcuts: OffcutPlate[],
  items: Item[],
  cutConfig: CutConfig,
  optimizationGoal: OptimizationGoal,
  mode: OffcutMode = 'consumption'
): OffcutUsageInfo[] {
  // モードに応じて処理を分岐
  if (mode === 'consumption') {
    return placeOnOffcutsConsumptionMode(offcuts, items, cutConfig, optimizationGoal)
  } else {
    return placeOnOffcutsOptimizationMode(offcuts, items, cutConfig, optimizationGoal)
  }
}

/**
 * 端材消費モード: 各端材で最高歩留まりの製品を選択
 */
function placeOnOffcutsConsumptionMode(
  offcuts: OffcutPlate[],
  items: Item[],
  cutConfig: CutConfig,
  optimizationGoal: OptimizationGoal
): OffcutUsageInfo[] {
  const results: OffcutUsageInfo[] = []

  // 各製品の配置済み数量を追跡
  const placedItemCounts = new Map<string, number>()
  for (const item of items) {
    placedItemCounts.set(item.id, 0)
  }

  // 1. 端材を1枚ずつ展開
  const expandedOffcuts: OffcutPlate[] = []
  for (const offcut of offcuts) {
    for (let i = 0; i < offcut.quantity; i++) {
      expandedOffcuts.push({
        ...offcut,
        id: `${offcut.id}-${i}`,
        quantity: 1, // 1枚ずつ
      })
    }
  }

  // 2. 面積順にソート（小さい順）
  const sortedOffcuts = sortOffcutsByArea(expandedOffcuts)

  // 3. 端材を1枚ずつ処理
  for (const offcut of sortedOffcuts) {
    // まだ配置可能な製品を取得（残り数量がある製品）
    const availableItems = items.filter((item) => {
      const placedCount = placedItemCounts.get(item.id) || 0
      return placedCount < item.quantity
    })

    if (availableItems.length === 0) {
      break // すべての製品が配置済み
    }

    // 端材に入る可能性がある製品を検証（cutWidthなし）
    const validItems = validateItemsForOffcut(availableItems, offcut.width, offcut.height)

    if (validItems.length === 0) {
      continue // この端材には入る製品がない
    }

    // この端材をPlateConfigとして扱う
    const offcutPlateConfig: PlateConfig = {
      width: offcut.width,
      height: offcut.height,
      unitPrice: 0, // 端材はコストなし
    }

    // 端材用のカット設定（余白なし）
    const offcutCutConfig: CutConfig = {
      cutWidth: cutConfig.cutWidth, // カット幅は製品間で必要
      margin: 0, // 端材には余白なし（既にカット済み）
    }

    // 製品リストをユニークにする（同じ製品種類は1つだけにする）
    const uniqueItems = Array.from(
      new Map(validItems.map((item) => [item.id.split('-')[0], item])).values()
    )

    // この端材での最良パターンを探す（部分最適）
    // 各製品種類を単独で試し、最も歩留まりが高いものを選ぶ
    let bestPattern: {
      result: CalculationResult
      placedIds: string[]
      yield: number
      itemCount: number
    } | null = null

    for (const singleItem of uniqueItems) {
      try {
        // まずグリッド配置を試す
        const gridResult = tryGridPlacements(
          singleItem,
          offcut.width,
          offcut.height,
          cutConfig.cutWidth
        )

        let yieldValue = 0
        let itemCount = 0
        let result: CalculationResult | null = null

        if (gridResult) {
          // グリッド配置から実際の配置座標を生成
          const placements = createGridPlacements(singleItem, gridResult, cutConfig.cutWidth)
          yieldValue = gridResult.yield
          itemCount = gridResult.count

          // CalculationResultを作成
          result = {
            patterns: [
              {
                placements: placements,
                yield: yieldValue,
                count: 1,
                patternId: '',
              },
            ],
            totalPlates: 1,
            averageYield: yieldValue,
            totalCost: 0,
            skippedItems: [],
          }
        } else {
          // グリッド配置が見つからない場合は従来のアルゴリズムを使用
          const itemWithHighQuantity = {
            ...singleItem,
            quantity: 100,
          }

          result = calculate(
            offcutPlateConfig,
            offcutCutConfig,
            [itemWithHighQuantity],
            optimizationGoal,
            false,
            true
          )

          if (result.patterns.length > 0 && result.patterns[0].placements.length > 0) {
            const pattern = result.patterns[0]
            yieldValue = pattern.yield
            itemCount = pattern.placements.length
          } else {
            continue
          }
        }

        // この端材での最良パターンを記録
        if (
          !bestPattern ||
          yieldValue > bestPattern.yield ||
          (yieldValue === bestPattern.yield && itemCount > bestPattern.itemCount)
        ) {
          bestPattern = {
            result,
            placedIds: [],
            yield: yieldValue,
            itemCount,
          }
        }
      } catch {
        continue
      }
    }

    // 配置できるパターンがなければ次の端材へ
    if (!bestPattern) {
      continue
    }

    // 配置した製品の数量を更新
    const pattern = bestPattern.result.patterns[0]
    const placedIds: string[] = []

    for (const placement of pattern.placements) {
      const originalItem = items.find(
        (item) => item.id === placement.item.id || placement.item.id.startsWith(`${item.id}-`)
      )

      if (originalItem) {
        const currentCount = placedItemCounts.get(originalItem.id) || 0
        placedItemCounts.set(originalItem.id, currentCount + 1)
        placedIds.push(placement.item.id)
      }
    }

    // 結果を保存
    results.push({
      offcut,
      pattern,
      platesUsed: 1, // 1枚ずつ処理
      placedItemIds: placedIds,
    })
  }

  return results
}

/**
 * 全体最適モード: 全体の平均歩留まりを最大化
 * 端材は必要に応じて使用、未使用端材は歩留まり計算から除外
 */
function placeOnOffcutsOptimizationMode(
  offcuts: OffcutPlate[],
  items: Item[],
  cutConfig: CutConfig,
  optimizationGoal: OptimizationGoal
): OffcutUsageInfo[] {
  const results: OffcutUsageInfo[] = []

  // 各製品の配置済み数量を追跡
  const placedItemCounts = new Map<string, number>()
  for (const item of items) {
    placedItemCounts.set(item.id, 0)
  }

  // 1. 端材を1枚ずつ展開
  const expandedOffcuts: OffcutPlate[] = []
  for (const offcut of offcuts) {
    for (let i = 0; i < offcut.quantity; i++) {
      expandedOffcuts.push({
        ...offcut,
        id: `${offcut.id}-${i}`,
        quantity: 1,
      })
    }
  }

  // 2. 面積順にソート（小さい順）
  const sortedOffcuts = sortOffcutsByArea(expandedOffcuts)

  // 3. 端材を1枚ずつ処理
  for (const offcut of sortedOffcuts) {
    const availableItems = items.filter((item) => {
      const placedCount = placedItemCounts.get(item.id) || 0
      return placedCount < item.quantity
    })

    if (availableItems.length === 0) {
      break
    }

    const validItems = validateItemsForOffcut(availableItems, offcut.width, offcut.height)

    if (validItems.length === 0) {
      continue
    }

    const offcutPlateConfig: PlateConfig = {
      width: offcut.width,
      height: offcut.height,
      unitPrice: 0,
    }

    const offcutCutConfig: CutConfig = {
      cutWidth: cutConfig.cutWidth,
      margin: 0,
    }

    const uniqueItems = Array.from(
      new Map(validItems.map((item) => [item.id.split('-')[0], item])).values()
    )

    let bestPattern: {
      result: CalculationResult
      placedIds: string[]
      yield: number
      itemCount: number
    } | null = null

    for (const singleItem of uniqueItems) {
      try {
        // まずグリッド配置を試す
        const gridResult = tryGridPlacements(
          singleItem,
          offcut.width,
          offcut.height,
          cutConfig.cutWidth
        )

        let yieldValue = 0
        let itemCount = 0
        let result: CalculationResult | null = null

        if (gridResult) {
          // グリッド配置から実際の配置座標を生成
          const placements = createGridPlacements(singleItem, gridResult, cutConfig.cutWidth)
          yieldValue = gridResult.yield
          itemCount = gridResult.count

          // CalculationResultを作成
          result = {
            patterns: [
              {
                placements: placements,
                yield: yieldValue,
                count: 1,
                patternId: '',
              },
            ],
            totalPlates: 1,
            averageYield: yieldValue,
            totalCost: 0,
            skippedItems: [],
          }
        } else {
          // グリッド配置が見つからない場合は従来のアルゴリズムを使用
          const itemWithHighQuantity = {
            ...singleItem,
            quantity: 100,
          }

          result = calculate(
            offcutPlateConfig,
            offcutCutConfig,
            [itemWithHighQuantity],
            optimizationGoal,
            false, // GAは使用しない
            true // グリッドグルーピングを使用
          )

          if (result.patterns.length > 0 && result.patterns[0].placements.length > 0) {
            const pattern = result.patterns[0]
            yieldValue = pattern.yield
            itemCount = pattern.placements.length
          } else {
            continue
          }
        }

        if (
          !bestPattern ||
          yieldValue > bestPattern.yield ||
          (yieldValue === bestPattern.yield && itemCount > bestPattern.itemCount)
        ) {
          bestPattern = {
            result,
            placedIds: [],
            yield: yieldValue,
            itemCount,
          }
        }
      } catch {
        continue
      }
    }

    if (!bestPattern) {
      continue
    }

    // 配置した製品の数量を更新
    const pattern = bestPattern.result.patterns[0]
    const placedIds: string[] = []

    for (const placement of pattern.placements) {
      const originalItem = items.find(
        (item) => item.id === placement.item.id || placement.item.id.startsWith(`${item.id}-`)
      )

      if (originalItem) {
        const currentCount = placedItemCounts.get(originalItem.id) || 0
        placedItemCounts.set(originalItem.id, currentCount + 1)
        placedIds.push(placement.item.id)
      }
    }

    // 結果を保存
    results.push({
      offcut,
      pattern,
      platesUsed: 1,
      placedItemIds: placedIds,
    })
  }

  return results
}

/**
 * 残った製品を取得（端材に配置できなかった製品）
 */
export function getRemainingItems(items: Item[], offcutResults: OffcutUsageInfo[]): Item[] {
  const remainingItems: Item[] = []

  for (const item of items) {
    // この製品が端材で何個配置されたか計算
    let placedCount = 0
    for (const result of offcutResults) {
      const itemPlacements = result.pattern.placements.filter(
        (p) => p.item.id === item.id || p.item.id.startsWith(`${item.id}-`)
      )
      placedCount += itemPlacements.length * result.platesUsed
    }

    // 残りの数量を計算
    const remainingQuantity = item.quantity - placedCount

    if (remainingQuantity > 0) {
      remainingItems.push({
        ...item,
        quantity: remainingQuantity,
      })
    }
  }

  return remainingItems
}

/**
 * 端材結果と新規元板結果を統合
 */
export function mergeResults(
  offcutResults: OffcutUsageInfo[],
  newPlateResults: CalculationResult,
  allOffcuts: OffcutPlate[],
  plateConfig: PlateConfig
): CalculationResult {
  // 使用した端材のID
  const usedOffcutIds = new Set(offcutResults.map((r) => r.offcut.id))

  // 使用しなかった端材
  const unusedOffcuts = allOffcuts.filter((o) => !usedOffcutIds.has(o.id))

  // 端材で配置した製品の合計
  const totalItemsOnOffcuts = offcutResults.reduce((sum, r) => {
    const itemCount = r.pattern.placements.length
    return sum + itemCount * r.platesUsed
  }, 0)

  // 端材パターンをグループ化
  const groupedOffcutPatterns: Array<
    PatternGroup & {
      isOffcut: true
      offcutInfo: {
        name: string
        size: string
        width: number
        height: number
      }
    }
  > = []

  for (const result of offcutResults) {
    // 同じパターンが既に存在するか確認
    const existingPattern = groupedOffcutPatterns.find((p) => {
      // 端材サイズが同じかチェック
      if (
        p.offcutInfo.width !== result.offcut.width ||
        p.offcutInfo.height !== result.offcut.height
      ) {
        return false
      }

      // 配置されている製品が同じかチェック
      if (p.placements.length !== result.pattern.placements.length) {
        return false
      }

      // 各配置が一致するかチェック
      return p.placements.every((placement, index) => {
        const otherPlacement = result.pattern.placements[index]
        return (
          placement.item.id === otherPlacement.item.id &&
          placement.item.width === otherPlacement.item.width &&
          placement.item.height === otherPlacement.item.height &&
          placement.x === otherPlacement.x &&
          placement.y === otherPlacement.y
        )
      })
    })

    if (existingPattern) {
      // 既存パターンの枚数を増やす
      existingPattern.count += result.platesUsed
    } else {
      // 新しいパターンとして追加
      groupedOffcutPatterns.push({
        ...result.pattern,
        patternId: `O-${groupedOffcutPatterns.length + 1}`,
        isOffcut: true,
        offcutInfo: {
          name: result.offcut.name,
          size: `${result.offcut.width}×${result.offcut.height}`,
          width: result.offcut.width,
          height: result.offcut.height,
        },
        count: result.platesUsed,
      })
    }
  }

  const offcutPatterns = groupedOffcutPatterns

  // パターンを統合（端材が先、新規元板が後）
  const allPatterns = [...offcutPatterns, ...newPlateResults.patterns]

  // 端材使用枚数を計算
  const offcutPlatesUsed = offcutResults.reduce((sum, r) => sum + r.platesUsed, 0)

  // 平均歩留まりを計算
  const totalArea =
    offcutPatterns.reduce((sum, p) => {
      const plateArea = p.offcutInfo.width * p.offcutInfo.height
      return sum + plateArea * p.count
    }, 0) +
    newPlateResults.patterns.reduce((sum, p) => {
      const plateArea = plateConfig.width * plateConfig.height
      return sum + plateArea * p.count
    }, 0)

  const totalUsedArea = [...offcutPatterns, ...newPlateResults.patterns].reduce((sum, p) => {
    const patternArea = p.placements.reduce((pSum, placement) => {
      return pSum + placement.item.width * placement.item.height
    }, 0)
    return sum + patternArea * p.count
  }, 0)

  const averageYield = totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0

  // 削減コスト（端材使用枚数 × 元板単価）
  const costSaved = offcutPlatesUsed * plateConfig.unitPrice

  return {
    patterns: allPatterns,
    totalPlates: offcutPlatesUsed + newPlateResults.totalPlates,
    averageYield,
    totalCost: newPlateResults.totalCost, // 端材はコストなし
    skippedItems: newPlateResults.skippedItems,
    offcutUsage: {
      used: offcutResults,
      unused: unusedOffcuts,
      totalItemsOnOffcuts,
      costSaved,
    },
    // v1.5 フィールドを保持
    yieldExcludingLast: newPlateResults.yieldExcludingLast,
    lastPatternYield: newPlateResults.lastPatternYield,
    meetsYieldTarget: newPlateResults.meetsYieldTarget,
    targetYield: newPlateResults.targetYield,
  }
}
