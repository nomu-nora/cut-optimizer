/**
 * 歩留まり優先モードの再編成ロジック
 * 製品総数と元板枚数を維持しつつ、N-1枚の歩留まりを最大化
 */

import type { CalculationResult, PlateConfig, CutConfig, Item, PatternGroup } from '@/types'
import { calculateMaximalRectangles } from './maximal-rectangles'
import { extractAllItemsFromPatterns, rebuildCalculationResult } from './two-stage-optimizer'

/**
 * 歩留まり優先モード: N-1枚の歩留まりを最大化
 *
 * アプローチ:
 * 1. 全製品を抽出（総数を絶対制約として維持）
 * 2. 元板枚数を維持（Stage 1で決定された枚数）
 * 3. 各元板に製品を割り当て直す
 * 4. 最後の元板は調整用（残りすべて）
 * 5. N-1枚の歩留まりを最大化する組み合わせを探索
 */
export function reorganizeForYield(
  initialResult: CalculationResult,
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): CalculationResult {
  console.log('🔄 reorganizeForYield: 歩留まり優先の再編成を開始')

  const patterns = initialResult.patterns.filter((p) => !p.isOffcut)

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

  // 複数回試行して最良の結果を選択
  let bestResult = initialResult
  let bestYieldExcludingLast = calculateYieldExcludingLastFromPatterns(patterns)

  const MAX_ATTEMPTS = 3

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    console.log(`\n🔁 試行${attempt + 1}回目`)

    // 製品をシャッフル（初回は面積降順、以降はランダム）
    const shuffledItems =
      attempt === 0
        ? [...allItems].sort((a, b) => b.width * b.height - a.width * a.height)
        : shuffleArray([...allItems])

    // 各元板に製品を割り当てる
    const newPatterns: PatternGroup[] = []
    // eslint-disable-next-line prefer-const
    let remainingItems = [...shuffledItems]
    let plateIndex = 0

    while (remainingItems.length > 0 && plateIndex < totalPlateCount) {
      const isLastPlate = plateIndex === totalPlateCount - 1
      const remainingPlates = totalPlateCount - plateIndex

      // このプレートに配置する製品を決定
      const itemsForThisPlate = isLastPlate
        ? remainingItems // 最後は残り全部
        : selectItemsForPlate(remainingItems, plateConfig, cutConfig, attempt, remainingPlates)

      // 配置を試行
      const pattern = tryPlaceItemsOnSinglePlate(itemsForThisPlate, plateConfig, cutConfig)

      if (pattern) {
        newPatterns.push(pattern)

        // 配置した製品をremainingItemsから削除（配置された数だけ1個ずつ削除）
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
        // 配置できない場合はこの試行を中止
        console.log(`  ⚠️  元板${plateIndex + 1}への配置失敗`)
        break
      }

      plateIndex++
    }

    // 製品数が一致するか確認
    const placedItemCount = newPatterns.reduce((sum, p) => sum + p.placements.length, 0)

    if (placedItemCount !== totalItemCount) {
      console.log(`  ❌ 製品数不一致: ${placedItemCount}/${totalItemCount}`)
      continue // この試行は失敗
    }

    if (newPatterns.length !== totalPlateCount) {
      console.log(`  ❌ 元板枚数不一致: ${newPatterns.length}/${totalPlateCount}`)
      continue
    }

    // 結果を評価
    const yieldExcludingLast = calculateYieldExcludingLastFromPatterns(newPatterns)

    console.log(`  📊 N-1枚の平均歩留まり: ${yieldExcludingLast.toFixed(1)}%`)

    if (yieldExcludingLast > bestYieldExcludingLast) {
      console.log(
        `  ✨ 改善! ${bestYieldExcludingLast.toFixed(1)}% → ${yieldExcludingLast.toFixed(1)}%`
      )
      // パターンをグループ化（同じ配置のパターンをまとめる）
      const groupedPatterns = groupIdenticalPatterns(newPatterns)
      // Stage 2では通常パターンのみを返す（端材パターンは除外）
      bestResult = rebuildCalculationResult(groupedPatterns, initialResult, plateConfig)
      bestYieldExcludingLast = yieldExcludingLast
    }
  }

  console.log(`✅ 再編成完了`)

  return bestResult
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
 * 元板に配置する製品を選択
 *
 * 戦略:
 * - 残りの元板枚数と製品数から、各元板の目安を計算
 * - 試行0: 面積ベースの貪欲法
 * - 試行1+: ランダムに選択（多様性）
 */
function selectItemsForPlate(
  availableItems: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  attemptIndex: number,
  remainingPlates: number
): Item[] {
  // 残りの元板に均等に配分する目安を計算
  const targetItemCount = Math.ceil(availableItems.length / remainingPlates)

  if (attemptIndex === 0) {
    // 試行0: 目安の個数まで大きい製品から選択
    const sorted = [...availableItems].sort((a, b) => b.width * b.height - a.width * a.height)
    const selected = sorted.slice(0, Math.min(targetItemCount, sorted.length))

    // 最低1個は選択
    return selected.length > 0 ? selected : [sorted[0]]
  } else {
    // 試行1+: ランダムに選択（多様性）
    const count = Math.min(
      Math.max(1, Math.floor(Math.random() * targetItemCount * 1.5)),
      availableItems.length
    )
    const shuffled = shuffleArray(availableItems)
    return shuffled.slice(0, count)
  }
}

/**
 * 製品リストを1枚の元板に配置
 *
 * 可能な限り多くの製品を配置し、配置したパターンを返す
 */
function tryPlaceItemsOnSinglePlate(
  items: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): PatternGroup | null {
  if (items.length === 0) return null

  try {
    const result = calculateMaximalRectangles(plateConfig, cutConfig, items, 'yield', false)

    if (result.patterns.length === 0) return null

    // 最初のパターン（最も効率的な配置）を返す
    const firstPattern = result.patterns[0]

    // 少なくとも1つの製品が配置されていればOK
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
 * パターンリストからN-1枚の平均歩留まりを計算
 */
function calculateYieldExcludingLastFromPatterns(patterns: PatternGroup[]): number {
  if (patterns.length <= 1) {
    return patterns[0]?.yield || 0
  }

  const patternsExcludingLast = patterns.slice(0, -1)
  const totalYield = patternsExcludingLast.reduce((sum, p) => sum + p.yield * (p.count || 1), 0)
  const totalCount = patternsExcludingLast.reduce((sum, p) => sum + (p.count || 1), 0)

  return totalCount > 0 ? totalYield / totalCount : 0
}

/**
 * 同じ配置のパターンをグループ化
 */
function groupIdenticalPatterns(patterns: PatternGroup[]): PatternGroup[] {
  const grouped: PatternGroup[] = []

  for (const pattern of patterns) {
    // 同じ配置のパターンを探す
    const existing = grouped.find((g) => arePatternsIdentical(g, pattern))

    if (existing) {
      // 既存のパターンのcountを増やす
      existing.count++
    } else {
      // 新しいパターンとして追加
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

  // 配置が同じかチェック（順序は無視）
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
