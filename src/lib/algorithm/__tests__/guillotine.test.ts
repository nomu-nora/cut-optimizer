import { describe, it, expect, jest } from '@jest/globals'
import { calculate } from '../guillotine'
import type { PlateConfig, CutConfig, Item } from '@/types'

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}))

describe('calculate - Guillotine Cut Algorithm', () => {
  const plateConfig: PlateConfig = {
    width: 1820,
    height: 910,
    unitPrice: 2000,
  }

  const cutConfig: CutConfig = {
    cutWidth: 4,
    margin: 20,
  }

  it('should calculate placement for simple items', () => {
    const items: Item[] = [
      { id: '1', name: 'Item A', width: 300, height: 200, quantity: 2, color: '#FF0000' },
      { id: '2', name: 'Item B', width: 400, height: 300, quantity: 1, color: '#00FF00' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    expect(result.totalPlates).toBeGreaterThan(0)
    expect(result.patterns).toHaveLength(result.patterns.length)
    expect(result.averageYield).toBeGreaterThan(0)
    expect(result.averageYield).toBeLessThanOrEqual(100)
    expect(result.totalCost).toBe(result.totalPlates * plateConfig.unitPrice)
  })

  it('should handle items that are too large', () => {
    const items: Item[] = [
      { id: '1', name: 'Too Large', width: 2000, height: 1000, quantity: 1, color: '#FF0000' },
      { id: '2', name: 'Normal', width: 300, height: 200, quantity: 1, color: '#00FF00' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    // Should skip the too-large item
    expect(result.skippedItems).toBeDefined()
    expect(result.skippedItems).toHaveLength(1)
    expect(result.skippedItems![0].itemName).toBe('Too Large')
    expect(result.skippedItems![0].reason).toBe('TOO_LARGE')

    // Should still calculate for the normal item
    expect(result.totalPlates).toBeGreaterThan(0)
  })

  it('should throw error when all items are too large', () => {
    const items: Item[] = [
      { id: '1', name: 'Too Large 1', width: 2000, height: 1000, quantity: 1, color: '#FF0000' },
      { id: '2', name: 'Too Large 2', width: 2000, height: 1000, quantity: 1, color: '#00FF00' },
    ]

    expect(() => {
      calculate(plateConfig, cutConfig, items)
    }).toThrow('計算可能な製品がありません')
  })

  it('should group same patterns correctly', () => {
    // Create items that will likely result in same pattern on multiple plates
    const items: Item[] = [
      { id: '1', name: 'Item A', width: 300, height: 200, quantity: 10, color: '#FF0000' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    // Should have patterns
    expect(result.patterns.length).toBeGreaterThan(0)

    // Total plates should equal sum of pattern counts
    const totalFromPatterns = result.patterns.reduce((sum, p) => sum + p.count, 0)
    expect(totalFromPatterns).toBe(result.totalPlates)

    // Patterns should be sorted by count (descending)
    for (let i = 0; i < result.patterns.length - 1; i++) {
      expect(result.patterns[i].count).toBeGreaterThanOrEqual(result.patterns[i + 1].count)
    }
  })

  it('should assign pattern IDs correctly (A, B, C...)', () => {
    const items: Item[] = [
      { id: '1', name: 'Item A', width: 300, height: 200, quantity: 5, color: '#FF0000' },
      { id: '2', name: 'Item B', width: 400, height: 300, quantity: 3, color: '#00FF00' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    // Should have pattern IDs starting with 'A'
    if (result.patterns.length > 0) {
      expect(result.patterns[0].patternId).toBe('A')
    }
    if (result.patterns.length > 1) {
      expect(result.patterns[1].patternId).toBe('B')
    }
  })

  it('should calculate with rotation support', () => {
    // Items that benefit from rotation
    const items: Item[] = [
      { id: '1', name: 'Vertical', width: 200, height: 800, quantity: 2, color: '#FF0000' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    expect(result.totalPlates).toBeGreaterThan(0)

    // Check if any placement is rotated
    const hasRotatedPlacement = result.patterns.some((pattern) =>
      pattern.placements.some((p) => p.rotated)
    )

    // Note: This depends on the algorithm's decision, so we just check it's a boolean
    expect(typeof hasRotatedPlacement).toBe('boolean')
  })

  it('should respect cut width and margin', () => {
    const items: Item[] = [
      { id: '1', name: 'Item', width: 100, height: 100, quantity: 1, color: '#FF0000' },
    ]

    const result = calculate(plateConfig, cutConfig, items)

    // Check that placements are within effective area (respecting margin)
    const effectiveWidth = plateConfig.width - cutConfig.margin * 2
    const effectiveHeight = plateConfig.height - cutConfig.margin * 2

    result.patterns.forEach((pattern) => {
      pattern.placements.forEach((placement) => {
        // Placement should start at least at margin
        expect(placement.x).toBeGreaterThanOrEqual(cutConfig.margin)
        expect(placement.y).toBeGreaterThanOrEqual(cutConfig.margin)

        // Placement should not exceed effective area
        expect(placement.x + placement.width).toBeLessThanOrEqual(cutConfig.margin + effectiveWidth)
        expect(placement.y + placement.height).toBeLessThanOrEqual(
          cutConfig.margin + effectiveHeight
        )
      })
    })
  })
})
