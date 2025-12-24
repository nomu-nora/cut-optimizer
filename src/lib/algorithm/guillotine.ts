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
  OffcutPlate,
  OffcutMode,
} from '@/types'
import { expandItems, sortByStrategy, type SortStrategy } from './sort'
import { decideRotation, type RotationStrategy } from './placement'
import { splitSpace } from './space'
import {
  calculateYield,
  calculateAverageYield,
  calculateYieldExcludingLast,
  getLastPatternYield,
  meetsYieldTarget,
} from './yield'
import { groupPatterns, getTotalPlatesFromPatterns } from './pattern'
import { calculateMaximalRectangles, type OptimizationGoal } from './maximal-rectangles'
import { optimizeWithGA } from './genetic-algorithm'
import { placeOnOffcuts, getRemainingItems, mergeResults } from './offcut-placement'
import { calculateWithTwoStageOptimization } from './two-stage-optimizer'

/**
 * 配置戦略の組み合わせ
 */
interface PlacementStrategy {
  sortStrategy: SortStrategy
  rotationStrategy: RotationStrategy
}

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
 * @param rotationStrategy 回転戦略
 * @returns 配置できたかどうか
 */
function tryPlaceItem(
  plate: Plate,
  item: Item,
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  rotationStrategy: RotationStrategy = 'max-space'
): boolean {
  // 空きスペースを面積順にソート（大きい順）
  const sortedSpaces = [...plate.freeSpaces].sort((a, b) => {
    const areaA = a.width * a.height
    const areaB = b.width * b.height
    return areaB - areaA
  })

  // 各空きスペースに配置を試みる
  for (const space of sortedSpaces) {
    const result = decideRotation(item, space, cutConfig, rotationStrategy)

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
 * 指定された戦略でGuillotine Cut + First Fit Decreasing アルゴリズムで配置計算
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @param strategy 配置戦略
 * @returns 計算結果
 */
function calculateWithStrategy(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  strategy: PlacementStrategy
): CalculationResult {
  // 前処理: 個数分に展開 + 戦略に応じてソート
  const expanded = expandItems(items)
  const sortedItems = sortByStrategy(expanded, strategy.sortStrategy)

  const plates: Plate[] = []
  let currentPlate = createNewPlate(plateConfig, cutConfig)

  // 各製品を配置
  for (const item of sortedItems) {
    const placed = tryPlaceItem(
      currentPlate,
      item,
      plateConfig,
      cutConfig,
      strategy.rotationStrategy
    )

    if (!placed) {
      // 配置できなかった場合、次の元板へ
      plates.push(currentPlate)
      currentPlate = createNewPlate(plateConfig, cutConfig)

      // 新しい元板に配置を試みる
      const placedInNewPlate = tryPlaceItem(
        currentPlate,
        item,
        plateConfig,
        cutConfig,
        strategy.rotationStrategy
      )

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

  // ===== v1.5: 新しい歩留まりメトリクスを計算 =====
  const targetYield = 85
  const yieldExcludingLast = calculateYieldExcludingLast(patterns)
  const lastPatternYield = getLastPatternYield(patterns)
  const meetsTarget = meetsYieldTarget(patterns, targetYield)

  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
    // v1.5: 新規フィールド
    yieldExcludingLast,
    lastPatternYield,
    meetsYieldTarget: meetsTarget,
    targetYield,
  }
}

/**
 * アルゴリズムの種類
 */
export type Algorithm = 'guillotine' | 'maximal-rectangles'

/**
 * 複数の戦略を試して最良のパターンを選択（ギロチンカット）
 * 注: 現在未使用（calculateMaximalRectanglesを使用）だが、将来の拡張用に残す
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @returns 計算結果
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateGuillotine(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[]
): CalculationResult {
  // 入力データのバリデーション
  const { validItems, skippedItems } = validateItems(items, plateConfig, cutConfig)

  if (validItems.length === 0) {
    throw new Error('計算可能な製品がありません。元板サイズを確認してください。')
  }

  // 試す戦略の組み合わせ
  const strategies: PlacementStrategy[] = [
    // 面積順の組み合わせ
    { sortStrategy: 'area', rotationStrategy: 'max-space' },
    { sortStrategy: 'area', rotationStrategy: 'fit-space' },
    { sortStrategy: 'area', rotationStrategy: 'prefer-rotate' },
    { sortStrategy: 'area', rotationStrategy: 'no-rotate' },

    // 幅優先の組み合わせ
    { sortStrategy: 'width', rotationStrategy: 'max-space' },
    { sortStrategy: 'width', rotationStrategy: 'fit-space' },
    { sortStrategy: 'width', rotationStrategy: 'no-rotate' },

    // 高さ優先の組み合わせ
    { sortStrategy: 'height', rotationStrategy: 'max-space' },
    { sortStrategy: 'height', rotationStrategy: 'fit-space' },
    { sortStrategy: 'height', rotationStrategy: 'no-rotate' },

    // 長辺優先の組み合わせ
    { sortStrategy: 'long-edge', rotationStrategy: 'max-space' },
    { sortStrategy: 'long-edge', rotationStrategy: 'fit-space' },

    // 短辺優先の組み合わせ
    { sortStrategy: 'short-edge', rotationStrategy: 'max-space' },
    { sortStrategy: 'short-edge', rotationStrategy: 'fit-space' },
  ]

  let bestResult: CalculationResult | null = null

  // 各戦略を試す
  for (const strategy of strategies) {
    try {
      const result = calculateWithStrategy(plateConfig, cutConfig, validItems, strategy)

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
      // エラー内容をログ出力（デバッグ用）
      console.error(
        `Strategy failed (sort: ${strategy.sortStrategy}, rotation: ${strategy.rotationStrategy}):`,
        error instanceof Error ? error.message : error
      )
      // この戦略では配置できなかった場合はスキップ
      continue
    }
  }

  if (!bestResult) {
    throw new Error('どの戦略でも配置できませんでした。')
  }

  // スキップされたアイテムを追加
  return {
    ...bestResult,
    skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
  }
}

/**
 * 配置計算のメイン関数（Maximal Rectanglesアルゴリズムを使用）
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @param optimizationGoal 最適化目標（デフォルト: yield）
 * @param useGA GAを使用するかどうか（デフォルト: false）
 * @param useGridGrouping グリッドグルーピングを使用するかどうか（デフォルト: false）
 * @returns 計算結果
 */
export function calculate(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  optimizationGoal: OptimizationGoal = 'yield',
  useGA: boolean = false,
  useGridGrouping: boolean = false
): CalculationResult {
  // GAを使用する場合
  if (useGA) {
    return optimizeWithGA(plateConfig, cutConfig, items, optimizationGoal, useGridGrouping)
  }

  // 2段階最適化を使用（デフォルト）
  return calculateWithTwoStageOptimization(
    plateConfig,
    cutConfig,
    items,
    optimizationGoal,
    useGridGrouping
  )
}

/**
 * 端材を優先的に使用して計算する（v1.3）
 *
 * @param plateConfig 元板設定
 * @param cutConfig 切断設定
 * @param items 製品リスト
 * @param offcuts 端材リスト
 * @param optimizationGoal 最適化目標
 * @returns 計算結果（端材使用情報付き）
 */
export function calculateWithOffcuts(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  offcuts: OffcutPlate[],
  optimizationGoal: OptimizationGoal = 'yield',
  offcutMode: OffcutMode = 'consumption'
): CalculationResult {
  // 端材がない場合は通常の計算
  if (offcuts.length === 0) {
    return calculate(plateConfig, cutConfig, items, optimizationGoal, false, false)
  }

  // 1. 端材に製品を配置
  const offcutResults = placeOnOffcuts(offcuts, items, cutConfig, optimizationGoal, offcutMode)

  // 2. 残った製品を取得
  const remainingItems = getRemainingItems(items, offcutResults)

  // 3. 残った製品で新規元板を計算
  const newPlateResults =
    remainingItems.length > 0
      ? calculate(plateConfig, cutConfig, remainingItems, optimizationGoal, false, false)
      : {
          patterns: [],
          totalPlates: 0,
          averageYield: 0,
          totalCost: 0,
          skippedItems: [],
        }

  // 4. 結果を統合
  return mergeResults(offcutResults, newPlateResults, offcuts, plateConfig)
}

// OptimizationGoal型をエクスポート
export type { OptimizationGoal }
