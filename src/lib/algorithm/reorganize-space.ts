/**
 * スペース優先モードの再編成ロジック
 * 端材サイズを最適化
 */

import type {
  CalculationResult,
  PlateConfig,
  CutConfig,
  FreeSpace,
  Item,
  PatternGroup,
} from '@/types'
import type { OffcutSize } from '@/types/optimization'
import { calculateMaximalRectangles } from './maximal-rectangles'
import { extractAllItemsFromPatterns, rebuildCalculationResult } from './two-stage-optimizer'

/**
 * スペース優先モード: 端材サイズを最適化
 *
 * アプローチ:
 * 1. 端材として望ましいサイズを自動検出（例: 800×600, 600×400など）
 * 2. 元板枚数を維持（絶対制約）
 * 3. 端材品質を最大化
 */
export function reorganizeForSpace(
  initialResult: CalculationResult,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): CalculationResult {
  console.log('🔄 reorganizeForSpace: スペース優先の再編成を開始')

  const patterns = initialResult.patterns.filter((p) => !p.isOffcut)

  // パターンが少ない場合は最適化効果が低い
  if (patterns.length <= 1) {
    console.log('⚠️  パターンが1つ以下のため、再編成をスキップ')
    return initialResult
  }

  // 全製品を抽出（パターンのcountを考慮）
  const allItems = extractAllItemsFromPatterns(patterns)
  const totalItemCount = allItems.length

  // 元板枚数を維持（通常パターンのみ）
  const totalPlateCount = patterns.reduce((sum, p) => sum + p.count, 0)

  console.log(`📊 製品総数: ${totalItemCount}個, 元板枚数: ${totalPlateCount}枚`)

  // ===== 1. 端材目標サイズを自動検出 =====
  const targetOffcutSizes = detectDesirableOffcutSizes(plateConfig, cutConfig)

  console.log(
    '🎯 目標端材サイズ:',
    targetOffcutSizes.map((s) => `${s.width}×${s.height}`).join(', ')
  )

  // ===== 2. 初期端材品質をスコアリング =====
  const initialScore = scoreOffcutQuality(initialResult, targetOffcutSizes, plateConfig)
  console.log(`📊 初期端材スコア: ${initialScore.toFixed(2)}`)

  // ===== 3. 再編成を複数回試行 =====
  let bestResult = initialResult
  let bestScore = initialScore

  const MAX_ATTEMPTS = 5

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    console.log(`\n🔁 試行${attempt + 1}回目`)

    // 製品をシャッフル（初回は面積降順、以降はランダム）
    const shuffledItems =
      attempt === 0
        ? [...allItems].sort((a, b) => b.width * b.height - a.width * a.height)
        : shuffleArray([...allItems])

    // 各元板に製品を割り当てる（端材を意識）
    const newPatterns: PatternGroup[] = []
    // eslint-disable-next-line prefer-const
    let remainingItems = [...shuffledItems]
    let plateIndex = 0

    while (remainingItems.length > 0 && plateIndex < totalPlateCount) {
      // このプレートに配置する製品を決定（端材を意識）
      const itemsForThisPlate = selectItemsForOffcutOptimization(
        remainingItems,
        plateConfig,
        cutConfig,
        targetOffcutSizes,
        attempt
      )

      // 配置を試行
      const pattern = tryPlaceItemsOnSinglePlate(itemsForThisPlate, plateConfig, cutConfig)

      if (pattern) {
        newPatterns.push(pattern)

        // 配置した製品をremainingItemsから削除
        for (const placement of pattern.placements) {
          const index = remainingItems.findIndex((item) => item.id === placement.item.id)
          if (index !== -1) {
            remainingItems.splice(index, 1)
          }
        }

        console.log(
          `  元板${plateIndex + 1}: ${pattern.placements.length}個配置, 歩留まり ${pattern.yield.toFixed(1)}%`
        )
      } else {
        console.log(`  ⚠️  元板${plateIndex + 1}への配置失敗`)
        break
      }

      plateIndex++
    }

    // 製品数と元板枚数の一致を確認
    const placedItemCount = newPatterns.reduce((sum, p) => sum + p.placements.length, 0)

    if (placedItemCount !== totalItemCount || newPatterns.length !== totalPlateCount) {
      console.log(
        `  ❌ 不一致: 製品${placedItemCount}/${totalItemCount}, 元板${newPatterns.length}/${totalPlateCount}`
      )
      continue
    }

    // 結果を評価
    const tempResult = rebuildCalculationResult(newPatterns, initialResult, plateConfig)
    const score = scoreOffcutQuality(tempResult, targetOffcutSizes, plateConfig)

    console.log(`  📊 端材スコア: ${score.toFixed(2)}`)

    if (score > bestScore) {
      console.log(`  ✨ 改善! ${bestScore.toFixed(2)} → ${score.toFixed(2)}`)
      const groupedPatterns = groupIdenticalPatterns(newPatterns)
      // Stage 2では通常パターンのみを返す（端材パターンは除外）
      bestResult = rebuildCalculationResult(groupedPatterns, initialResult, plateConfig)
      bestScore = score
    }
  }

  console.log(`✅ 再編成完了 - 最終スコア: ${bestScore.toFixed(2)}`)

  return bestResult
}

/**
 * 望ましい端材サイズを自動検出
 *
 * ヒューリスティック:
 * 1. 元板サイズの1/4, 1/2などの標準サイズ
 * 2. 一般的な使いやすいサイズ（800×600, 600×400など）
 */
export function detectDesirableOffcutSizes(
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): OffcutSize[] {
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2

  const sizes: OffcutSize[] = []

  // 1. 元板の分数サイズ
  sizes.push({
    width: Math.floor(effectiveWidth / 2),
    height: Math.floor(effectiveHeight / 2),
  })
  sizes.push({
    width: Math.floor(effectiveWidth / 2),
    height: Math.floor(effectiveHeight / 3),
  })
  sizes.push({
    width: Math.floor(effectiveWidth / 3),
    height: Math.floor(effectiveHeight / 2),
  })

  // 2. 一般的な使いやすいサイズ（日本の木材規格を参考）
  const commonSizes = [
    { width: 800, height: 600 },
    { width: 600, height: 400 },
    { width: 900, height: 450 },
    { width: 1000, height: 500 },
  ]

  for (const size of commonSizes) {
    // 有効範囲内のサイズのみ追加
    if (size.width <= effectiveWidth && size.height <= effectiveHeight) {
      sizes.push(size)
    }
  }

  // 重複削除 & サイズ降順ソート
  const uniqueSizes = deduplicateAndSort(sizes)

  // 上位3-5個を返す
  return uniqueSizes.slice(0, 5)
}

/**
 * サイズの重複削除とソート
 */
function deduplicateAndSort(sizes: OffcutSize[]): OffcutSize[] {
  // 面積で重複削除
  const seen = new Set<string>()
  const unique: OffcutSize[] = []

  for (const size of sizes) {
    const key = `${size.width}x${size.height}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(size)
    }
  }

  // 面積降順でソート
  return unique.sort((a, b) => b.width * b.height - a.width * a.height)
}

/**
 * 端材品質をスコアリング
 *
 * 評価軸:
 * - 目標サイズに近い端材の数
 * - 端材の形状品質（矩形性）
 * - 端材の合計面積
 */
export function scoreOffcutQuality(
  result: CalculationResult,
  targetSizes: OffcutSize[],
  plateConfig: PlateConfig
): number {
  let score = 0

  // パターンごとに評価
  for (const pattern of result.patterns) {
    if (pattern.isOffcut) continue

    // 余白スペースを推定（簡易版）
    // TODO: 実際のfreeSpacesを取得する仕組みが必要
    const estimatedFreeSpaces = estimateFreeSpaces(pattern, plateConfig)

    for (const space of estimatedFreeSpaces) {
      // 1. 目標サイズとの近さ
      const proximityScore = targetSizes.reduce((max, target) => {
        const widthMatch = Math.min(space.width, target.width) / Math.max(space.width, target.width)
        const heightMatch =
          Math.min(space.height, target.height) / Math.max(space.height, target.height)
        const matchScore = (widthMatch + heightMatch) / 2
        return Math.max(max, matchScore)
      }, 0)

      // 2. 形状品質（正方形に近いほど良い）
      const aspectRatio = space.width / space.height
      const shapeScore = 1 / (1 + Math.abs(aspectRatio - 1))

      // 3. サイズスコア
      const area = space.width * space.height
      const plateArea = plateConfig.width * plateConfig.height
      const sizeScore = area / plateArea

      score += proximityScore * 100 + shapeScore * 50 + sizeScore * 30
    }
  }

  return score
}

/**
 * 余白スペースを推定（簡易版）
 *
 * TODO: 実際のPlateオブジェクトからfreeSpacesを取得する必要がある
 * 現在は歩留まりから逆算して推定
 */
function estimateFreeSpaces(pattern: PatternGroup, plateConfig: PlateConfig): FreeSpace[] {
  // 簡易版: 歩留まりから余白を推定
  const plateArea = plateConfig.width * plateConfig.height
  const usedRatio = pattern.yield / 100
  const freeArea = plateArea * (1 - usedRatio)

  // 簡易的に1つの矩形として返す
  // TODO: より正確な余白形状の推定が必要
  const estimatedWidth = Math.sqrt(freeArea)
  const estimatedHeight = Math.sqrt(freeArea)

  return [
    {
      x: 0,
      y: 0,
      width: Math.floor(estimatedWidth),
      height: Math.floor(estimatedHeight),
    },
  ]
}

/**
 * 配列をシャッフル
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 端材最適化のための製品選択
 *
 * 戦略:
 * - 目標端材サイズを意識した製品選択
 * - 歩留まり70-80%程度を維持（完全に詰め込まない）
 */
function selectItemsForOffcutOptimization(
  availableItems: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  targetOffcutSizes: OffcutSize[],
  attemptIndex: number
): Item[] {
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2
  const plateArea = effectiveWidth * effectiveHeight

  // 目標端材サイズから目標使用率を計算
  const targetOffcutArea =
    targetOffcutSizes.length > 0 ? targetOffcutSizes[0].width * targetOffcutSizes[0].height : 0
  const baseTargetUsage = targetOffcutArea > 0 ? 1 - targetOffcutArea / plateArea : 0.75

  // 目標使用率: 端材を残すため（70-80%程度）
  const targetUsageMin = Math.max(0.65, baseTargetUsage - 0.1)
  const targetUsageMax = Math.min(0.85, baseTargetUsage + 0.05)

  if (attemptIndex === 0) {
    // 試行0: 面積ベースの貪欲法（端材を意識）
    const sorted = [...availableItems].sort((a, b) => b.width * b.height - a.width * a.height)

    const selected: Item[] = []
    let usedArea = 0

    for (const item of sorted) {
      const itemArea = item.width * item.height

      // 目標範囲内なら追加
      if (usedArea + itemArea <= plateArea * targetUsageMax) {
        selected.push(item)
        usedArea += itemArea
      }

      // 目標最小値を超えたら終了
      if (usedArea >= plateArea * targetUsageMin) {
        break
      }
    }

    // 最低1個は選択
    if (selected.length === 0 && sorted.length > 0) {
      selected.push(sorted[0])
    }

    return selected
  } else {
    // 試行1+: ランダムに選択（多様性）
    const count = Math.min(Math.max(2, Math.floor(Math.random() * 8)), availableItems.length)
    const shuffled = shuffleArray(availableItems)
    return shuffled.slice(0, count)
  }
}

/**
 * 製品リストを1枚の元板に配置
 */
function tryPlaceItemsOnSinglePlate(
  items: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): PatternGroup | null {
  if (items.length === 0) return null

  try {
    const result = calculateMaximalRectangles(
      plateConfig,
      cutConfig,
      items,
      'remaining-space',
      false
    )

    if (result.patterns.length === 0) return null

    const firstPattern = result.patterns[0]

    if (firstPattern.placements.length > 0) {
      return {
        ...firstPattern,
        count: 1,
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * 同じ配置のパターンをグループ化
 */
function groupIdenticalPatterns(patterns: PatternGroup[]): PatternGroup[] {
  const grouped: PatternGroup[] = []

  for (const pattern of patterns) {
    const existing = grouped.find((g) => arePatternsIdentical(g, pattern))

    if (existing) {
      existing.count++
    } else {
      grouped.push({
        ...pattern,
        count: 1,
      })
    }
  }

  return grouped
}

/**
 * 2つのパターンが同じ配置かチェック
 */
function arePatternsIdentical(p1: PatternGroup, p2: PatternGroup): boolean {
  if (p1.placements.length !== p2.placements.length) {
    return false
  }

  const placements1 = [...p1.placements].sort(
    (a, b) => a.x - b.x || a.y - b.y || a.item.id.localeCompare(b.item.id)
  )
  const placements2 = [...p2.placements].sort(
    (a, b) => a.x - b.x || a.y - b.y || a.item.id.localeCompare(b.item.id)
  )

  return placements1.every((p1, i) => {
    const p2 = placements2[i]
    return (
      p1.item.id === p2.item.id &&
      p1.x === p2.x &&
      p1.y === p2.y &&
      p1.width === p2.width &&
      p1.height === p2.height &&
      p1.rotated === p2.rotated
    )
  })
}
