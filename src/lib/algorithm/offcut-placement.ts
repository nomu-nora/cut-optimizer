/**
 * 端材（余り材）配置アルゴリズム
 * v1.3で追加
 */

import type { OffcutPlate, OffcutUsageInfo, Item, PlateConfig, CutConfig, CalculationResult, PatternGroup } from '@/types'
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
 * 端材用の製品検証（cutWidthを含めない）
 * 端材は既にカット済みなので、製品が入るかの検証だけを行う
 */
function validateItemsForOffcut(
  items: Item[],
  offcutWidth: number,
  offcutHeight: number
): Item[] {
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
  optimizationGoal: OptimizationGoal
): OffcutUsageInfo[] {
  const results: OffcutUsageInfo[] = []
  const placedItemIds = new Set<string>()

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
    // まだ配置されていない製品を取得
    const availableItems = items.filter((item) => !placedItemIds.has(item.id))

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

    // 試す製品の組み合わせを準備
    const itemSetsToTry: Item[][] = [
      // 1. 各製品種類単独
      ...uniqueItems.map((item) => [item]),
      // 2. 全製品一緒
      validItems,
    ]

    // この端材での最良パターンを探す
    let bestPattern: {
      result: CalculationResult
      placedIds: string[]
      yield: number
    } | null = null

    for (const itemSet of itemSetsToTry) {
      try {
        // 製品の数量を大量に設定（1枚に最大限詰め込むため）
        const itemSetWithHighQuantity = itemSet.map((item) => ({
          ...item,
          quantity: 100, // 大量に設定
        }))

        // この製品セットで配置を試行
        const result = calculate(
          offcutPlateConfig,
          offcutCutConfig,
          itemSetWithHighQuantity,
          optimizationGoal,
          false, // GAは使用しない（高速化）
          false  // グリッドグルーピングも使用しない
        )

        // 配置できた製品があるか確認
        if (result.patterns.length > 0 && result.patterns[0].placements.length > 0) {
          const pattern = result.patterns[0]
          const yieldValue = pattern.yield

          // 配置できた製品のIDを収集
          const placedIds: string[] = []
          for (const placement of pattern.placements) {
            if (!placedItemIds.has(placement.item.id)) {
              placedIds.push(placement.item.id)
            }
          }

          // この端材での最良パターンを記録
          if (placedIds.length > 0 && (!bestPattern || yieldValue > bestPattern.yield)) {
            bestPattern = {
              result,
              placedIds,
              yield: yieldValue,
            }
          }
        }
      } catch (error) {
        // この製品セットでは配置できなかった
        continue
      }
    }

    // 配置できるパターンがなければ次の端材へ
    if (!bestPattern) {
      continue
    }

    // 配置した製品をマーク
    for (const itemId of bestPattern.placedIds) {
      placedItemIds.add(itemId)
    }

    // 結果を保存
    results.push({
      offcut,
      pattern: bestPattern.result.patterns[0],
      platesUsed: 1, // 1枚ずつ処理
      placedItemIds: bestPattern.placedIds,
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

  // 端材パターンに情報を追加
  const offcutPatterns = offcutResults.map((r, index) => ({
    ...r.pattern,
    patternId: `O-${index + 1}`,
    isOffcut: true,
    offcutInfo: {
      name: r.offcut.name,
      size: `${r.offcut.width}×${r.offcut.height}`,
    },
    count: r.platesUsed,
  }))

  // パターンを統合（端材が先、新規元板が後）
  const allPatterns = [...offcutPatterns, ...newPlateResults.patterns]

  // 端材使用枚数を計算
  const offcutPlatesUsed = offcutResults.reduce((sum, r) => sum + r.platesUsed, 0)

  // 平均歩留まりを計算
  const totalArea = offcutPatterns.reduce((sum, p) => {
    const offcutInfo = offcutResults.find((r) => `O-${offcutResults.indexOf(r) + 1}` === p.patternId)
    if (offcutInfo) {
      const plateArea = offcutInfo.offcut.width * offcutInfo.offcut.height
      return sum + plateArea * p.count
    }
    return sum
  }, 0) + newPlateResults.patterns.reduce((sum, p) => {
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
  }
}
