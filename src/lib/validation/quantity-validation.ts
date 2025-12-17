import type { EditableResult, StagingArea, Item } from '@/types'

export interface QuantityValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 数量整合性をバリデーション
 * 配置された製品の合計数が登録された数量と一致するか確認
 * @param editableResult 編集中の結果
 * @param stagingArea 仮置き場
 * @param originalItems 元の製品リスト
 * @returns バリデーション結果
 */
export function validateQuantities(
  editableResult: EditableResult,
  stagingArea: StagingArea,
  originalItems: Item[]
): QuantityValidationResult {
  console.log('=== validateQuantities ===')
  console.log('editableResult.patterns:', editableResult.patterns)
  console.log('stagingArea.products:', stagingArea.products)
  console.log('originalItems:', originalItems)

  const placedCounts = new Map<string, number>()

  // Helper function to extract base item ID (extract UUID portion only)
  const getBaseItemId = (itemId: string): string => {
    // Extract UUID pattern (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = itemId.match(uuidPattern)
    if (match) {
      return match[0]
    }
    // Fallback: return as-is if no UUID found
    return itemId
  }

  // Count in all patterns
  for (const pattern of editableResult.patterns) {
    console.log(
      `Pattern ${pattern.patternId}: ${pattern.placements.length} placements, count=${pattern.count}`
    )
    for (const placement of pattern.placements) {
      const itemId = placement.item.id
      const baseItemId = getBaseItemId(itemId)
      const currentCount = placedCounts.get(baseItemId) || 0
      const newCount = currentCount + pattern.count
      console.log(
        `  Item ${placement.item.name} (${itemId} -> ${baseItemId}): ${currentCount} + ${pattern.count} = ${newCount}`
      )
      placedCounts.set(baseItemId, newCount)
    }
  }

  // Add staging
  for (const product of stagingArea.products) {
    const itemId = product.item.id
    const baseItemId = getBaseItemId(itemId)
    placedCounts.set(baseItemId, (placedCounts.get(baseItemId) || 0) + 1)
  }

  // Validate
  const errors: string[] = []
  for (const item of originalItems) {
    const placed = placedCounts.get(item.id) || 0
    const required = item.quantity
    if (placed !== required) {
      errors.push(`${item.name}: 配置数${placed} ≠ 登録数${required}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 製品ごとの配置数を取得
 * @param editableResult 編集中の結果
 * @param stagingArea 仮置き場
 * @returns 製品IDごとの配置数マップ
 */
export function getPlacedCounts(
  editableResult: EditableResult,
  stagingArea: StagingArea
): Map<string, number> {
  // Helper function to extract base item ID (extract UUID portion only)
  const getBaseItemId = (itemId: string): string => {
    // Extract UUID pattern (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = itemId.match(uuidPattern)
    if (match) {
      return match[0]
    }
    // Fallback: return as-is if no UUID found
    return itemId
  }

  const placedCounts = new Map<string, number>()

  // Count in all patterns
  for (const pattern of editableResult.patterns) {
    for (const placement of pattern.placements) {
      const itemId = placement.item.id
      const baseItemId = getBaseItemId(itemId)
      placedCounts.set(baseItemId, (placedCounts.get(baseItemId) || 0) + pattern.count)
    }
  }

  // Add staging
  for (const product of stagingArea.products) {
    const itemId = product.item.id
    const baseItemId = getBaseItemId(itemId)
    placedCounts.set(baseItemId, (placedCounts.get(baseItemId) || 0) + 1)
  }

  return placedCounts
}
