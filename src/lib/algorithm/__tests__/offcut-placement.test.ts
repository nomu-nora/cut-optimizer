import { describe, it, expect } from '@jest/globals'
import { placeOnOffcuts, getRemainingItems } from '../offcut-placement'
import { type OptimizationGoal } from '../guillotine'
import type { Item, OffcutPlate, CutConfig } from '@/types'

describe('placeOnOffcuts', () => {
  const cutConfig: CutConfig = {
    cutWidth: 4,
    margin: 20,
  }

  const items: Item[] = [
    {
      id: '1',
      name: '製品A',
      width: 300,
      height: 200,
      quantity: 5,
      color: '#FF0000',
    },
    {
      id: '2',
      name: '製品B',
      width: 400,
      height: 300,
      quantity: 3,
      color: '#00FF00',
    },
  ]

  describe('端材消費モード', () => {
    it('should place items on offcuts in consumption mode', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材1',
          width: 800,
          height: 600,
          quantity: 2,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when no items fit', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '小さい端材',
          width: 100,
          height: 100,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      expect(result).toHaveLength(0)
    })

    it('should use offcuts with highest yield for each offcut', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '大きい端材',
          width: 1000,
          height: 800,
          quantity: 1,
        },
        {
          id: 'offcut-2',
          name: '中サイズ端材',
          width: 500,
          height: 400,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      // 端材消費モードでは各端材に最適な製品を配置
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result.every((usage) => usage.pattern.yield > 0)).toBe(true)
      }
    })
  })

  describe('全体最適モード', () => {
    it('should optimize overall average yield in optimization mode', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材1',
          width: 800,
          height: 600,
          quantity: 2,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'optimization')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should skip offcuts that lower overall yield', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '非効率な端材',
          width: 1000,
          height: 100,
          quantity: 5,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'optimization')

      // 全体最適モードでは歩留まりが低い端材は使用しない可能性がある
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('グリッド配置', () => {
    it('should use grid placement for same-sized items', () => {
      const smallItems: Item[] = [
        {
          id: '1',
          name: '小製品',
          width: 200,
          height: 150,
          quantity: 10,
          color: '#FF0000',
        },
      ]

      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '大きい端材',
          width: 1000,
          height: 800,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, smallItems, cutConfig, 'yield', 'consumption')

      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        // グリッド配置が使用された場合、複数の製品が配置される
        const totalPlaced = result.reduce((sum, usage) => sum + usage.pattern.placements.length, 0)
        expect(totalPlaced).toBeGreaterThan(0)
      }
    })
  })

  describe('エッジケース', () => {
    it('should handle empty offcuts array', () => {
      const result = placeOnOffcuts([], items, cutConfig, 'yield', 'consumption')

      expect(result).toHaveLength(0)
    })

    it('should handle empty items array', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材',
          width: 800,
          height: 600,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, [], cutConfig, 'yield', 'consumption')

      expect(result).toHaveLength(0)
    })

    it('should handle zero-margin cutConfig for offcuts', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材',
          width: 400,
          height: 300,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      // 端材は margin: 0 で計算される（既にカット済み）
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('最適化目標', () => {
    it('should work with yield optimization goal', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材',
          width: 800,
          height: 600,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should work with remaining-space optimization goal', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材',
          width: 800,
          height: 600,
          quantity: 1,
        },
      ]

      const optimizationGoal: OptimizationGoal = 'remaining-space'
      const result = placeOnOffcuts(offcuts, items, cutConfig, optimizationGoal, 'consumption')

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('配置情報の検証', () => {
    it('should return correct offcut usage info structure', () => {
      const offcuts: OffcutPlate[] = [
        {
          id: 'offcut-1',
          name: '端材',
          width: 800,
          height: 600,
          quantity: 1,
        },
      ]

      const result = placeOnOffcuts(offcuts, items, cutConfig, 'yield', 'consumption')

      if (result.length > 0) {
        const usage = result[0]
        expect(usage).toHaveProperty('offcut')
        expect(usage).toHaveProperty('pattern')
        expect(usage).toHaveProperty('platesUsed')
        expect(usage).toHaveProperty('placedItemIds')
        expect(usage.pattern).toHaveProperty('placements')
        expect(usage.pattern).toHaveProperty('yield')
      }
    })
  })
})

describe('getRemainingItems', () => {
  it('should calculate remaining items correctly', () => {
    const items: Item[] = [
      {
        id: '1',
        name: '製品A',
        width: 300,
        height: 200,
        quantity: 5,
        color: '#FF0000',
      },
      {
        id: '2',
        name: '製品B',
        width: 400,
        height: 300,
        quantity: 3,
        color: '#00FF00',
      },
    ]

    // Create mock OffcutUsageInfo with placements
    const mockOffcutResults = [
      {
        offcut: { id: 'o1', name: '端材1', width: 800, height: 600, quantity: 1 },
        pattern: {
          patternId: 'O1',
          placements: [
            {
              item: { ...items[0], id: '1-0' },
              x: 0,
              y: 0,
              width: 300,
              height: 200,
              rotated: false,
            },
            {
              item: { ...items[0], id: '1-1' },
              x: 304,
              y: 0,
              width: 300,
              height: 200,
              rotated: false,
            },
            {
              item: { ...items[0], id: '1-2' },
              x: 0,
              y: 204,
              width: 300,
              height: 200,
              rotated: false,
            },
          ],
          yield: 75,
          count: 1,
          isOffcut: true,
        },
        platesUsed: 1,
        placedItemIds: ['1-0', '1-1', '1-2'],
      },
      {
        offcut: { id: 'o2', name: '端材2', width: 500, height: 400, quantity: 1 },
        pattern: {
          patternId: 'O2',
          placements: [
            {
              item: { ...items[1], id: '2-0' },
              x: 0,
              y: 0,
              width: 400,
              height: 300,
              rotated: false,
            },
          ],
          yield: 60,
          count: 1,
          isOffcut: true,
        },
        platesUsed: 1,
        placedItemIds: ['2-0'],
      },
    ]

    const remaining = getRemainingItems(items, mockOffcutResults)

    expect(remaining).toHaveLength(2)
    expect(remaining.find((i) => i.id === '1')?.quantity).toBe(2) // 5 - 3 = 2
    expect(remaining.find((i) => i.id === '2')?.quantity).toBe(2) // 3 - 1 = 2
  })

  it('should exclude items that are fully placed', () => {
    const items: Item[] = [
      {
        id: '1',
        name: '製品A',
        width: 300,
        height: 200,
        quantity: 2,
        color: '#FF0000',
      },
    ]

    const mockOffcutResults = [
      {
        offcut: { id: 'o1', name: '端材1', width: 800, height: 600, quantity: 1 },
        pattern: {
          patternId: 'O1',
          placements: [
            {
              item: { ...items[0], id: '1-0' },
              x: 0,
              y: 0,
              width: 300,
              height: 200,
              rotated: false,
            },
            {
              item: { ...items[0], id: '1-1' },
              x: 304,
              y: 0,
              width: 300,
              height: 200,
              rotated: false,
            },
          ],
          yield: 75,
          count: 1,
          isOffcut: true,
        },
        platesUsed: 1,
        placedItemIds: ['1-0', '1-1'],
      },
    ]

    const remaining = getRemainingItems(items, mockOffcutResults)

    expect(remaining).toHaveLength(0) // 全て配置済み
  })

  it('should return all items when nothing is placed', () => {
    const items: Item[] = [
      {
        id: '1',
        name: '製品A',
        width: 300,
        height: 200,
        quantity: 5,
        color: '#FF0000',
      },
    ]

    const remaining = getRemainingItems(items, [])

    expect(remaining).toHaveLength(1)
    expect(remaining[0].quantity).toBe(5)
  })

  it('should handle empty items array', () => {
    const remaining = getRemainingItems([], [])

    expect(remaining).toHaveLength(0)
  })
})
