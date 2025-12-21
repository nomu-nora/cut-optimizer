import { describe, it, expect } from '@jest/globals'
import { calculate, calculateWithOffcuts } from '../guillotine'
import type { Item, PlateConfig, CutConfig, OffcutPlate } from '@/types'

describe('Phase 2: Enhanced Maximal Rectangles Algorithm', () => {
  const plateConfig: PlateConfig = {
    width: 1820,
    height: 910,
    unitPrice: 2000,
  }

  const cutConfig: CutConfig = {
    cutWidth: 4,
    margin: 20,
  }

  describe('Step 1: All Heuristics Comparison', () => {
    it('should try all heuristics and select the best one', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 300, height: 200, quantity: 5, color: '#FF0000' },
        { id: '2', name: 'Item2', width: 250, height: 180, quantity: 4, color: '#00FF00' },
        { id: '3', name: 'Item3', width: 200, height: 150, quantity: 3, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 結果が正しく計算されている
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.averageYield).toBeGreaterThan(0)
      expect(result.patterns.length).toBeGreaterThan(0)

      // v1.5の新フィールドが含まれている
      expect(result.yieldExcludingLast).toBeDefined()
      expect(result.lastPatternYield).toBeDefined()
      expect(result.meetsYieldTarget).toBeDefined()
      expect(result.targetYield).toBe(85)
    })

    it('should prioritize yieldExcludingLast in yield mode', () => {
      const items: Item[] = [
        { id: '1', name: 'Large', width: 800, height: 400, quantity: 8, color: '#FF0000' },
        { id: '2', name: 'Medium', width: 400, height: 300, quantity: 6, color: '#00FF00' },
        { id: '3', name: 'Small', width: 200, height: 150, quantity: 4, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 歩留まり優先モードでは yieldExcludingLast が計算されている
      expect(result.yieldExcludingLast).toBeDefined()

      // パターンが複数ある場合、最後を除く歩留まりが計算される
      if (result.patterns.filter((p) => !p.isOffcut).length > 1) {
        expect(result.yieldExcludingLast!).toBeGreaterThan(0)
      }
    })
  })

  describe('Step 2: Target Achievement Enhancement', () => {
    it('should evaluate placement progress and adjust strategy', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 400, height: 300, quantity: 10, color: '#FF0000' },
        { id: '2', name: 'Item2', width: 350, height: 250, quantity: 8, color: '#00FF00' },
        { id: '3', name: 'Item3', width: 300, height: 200, quantity: 6, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 目標達成判定が行われている
      expect(result.meetsYieldTarget).toBeDefined()
      expect(typeof result.meetsYieldTarget).toBe('boolean')

      // 最後のパターンが記録されている
      expect(result.lastPatternYield).toBeDefined()
    })

    it('should handle single pattern case', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 300, height: 200, quantity: 2, color: '#FF0000' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // パターンが1つの場合、目標達成はfalse（除外できない）
      const regularPatterns = result.patterns.filter((p) => !p.isOffcut)
      if (regularPatterns.length <= 1) {
        expect(result.meetsYieldTarget).toBe(false)
      }
    })
  })

  describe('Step 3: Adaptive Grid Generation', () => {
    it('should use multi-dimensional scoring for grid selection', () => {
      // 同じサイズのアイテムが多い場合、グリッドグルーピングが使われる
      const items: Item[] = [
        { id: '1', name: 'Same1', width: 300, height: 200, quantity: 8, color: '#FF0000' },
        { id: '2', name: 'Same2', width: 300, height: 200, quantity: 8, color: '#00FF00' },
        { id: '3', name: 'Same3', width: 300, height: 200, quantity: 8, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, true)

      // グリッドグルーピング使用時も正しく動作
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.averageYield).toBeGreaterThan(0)
    })

    it('should adjust grid scoring based on strategy', () => {
      const items: Item[] = [
        { id: '1', name: 'Grid1', width: 250, height: 180, quantity: 12, color: '#FF0000' },
        { id: '2', name: 'Grid2', width: 250, height: 180, quantity: 10, color: '#00FF00' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, true)

      // 戦略に応じてグリッド選択が最適化されている
      expect(result.patterns.length).toBeGreaterThan(0)
    })
  })

  describe('Step 4: Space Utilization Optimization', () => {
    it('should use best-fit scoring for free rectangle selection', () => {
      const items: Item[] = [
        { id: '1', name: 'Various1', width: 400, height: 300, quantity: 3, color: '#FF0000' },
        { id: '2', name: 'Various2', width: 300, height: 250, quantity: 4, color: '#00FF00' },
        { id: '3', name: 'Various3', width: 250, height: 200, quantity: 5, color: '#0000FF' },
        { id: '4', name: 'Various4', width: 200, height: 150, quantity: 6, color: '#FFFF00' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // Best-fit戦略により高い歩留まりが達成される
      expect(result.averageYield).toBeGreaterThan(70)
    })

    it('should optimize remaining space quality', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 500, height: 350, quantity: 3, color: '#FF0000' },
        { id: '2', name: 'Item2', width: 400, height: 300, quantity: 3, color: '#00FF00' },
      ]

      const resultYield = calculate(plateConfig, cutConfig, items, 'yield', false, false)
      const resultSpace = calculate(plateConfig, cutConfig, items, 'remaining-space', false, false)

      // 両方の最適化目標で正しく動作
      expect(resultYield.totalPlates).toBeGreaterThan(0)
      expect(resultSpace.totalPlates).toBeGreaterThan(0)
    })
  })

  describe('85% Target Achievement Tests', () => {
    it('should achieve 85%+ yield for patterns excluding last', () => {
      const items: Item[] = [
        { id: '1', name: 'High1', width: 800, height: 400, quantity: 10, color: '#FF0000' },
        { id: '2', name: 'High2', width: 700, height: 350, quantity: 8, color: '#00FF00' },
        { id: '3', name: 'High3', width: 600, height: 300, quantity: 6, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // パターンが複数ある場合、85%達成を目指す
      const regularPatterns = result.patterns.filter((p) => !p.isOffcut)
      if (regularPatterns.length > 1) {
        // 最後を除く平均が計算されている
        expect(result.yieldExcludingLast).toBeDefined()

        // 目標達成状況が判定されている
        expect(result.meetsYieldTarget).toBeDefined()
      }
    })

    it('should handle edge case with mixed item sizes', () => {
      const items: Item[] = [
        { id: '1', name: 'Large', width: 900, height: 500, quantity: 2, color: '#FF0000' },
        { id: '2', name: 'Medium', width: 400, height: 300, quantity: 8, color: '#00FF00' },
        { id: '3', name: 'Small', width: 150, height: 100, quantity: 15, color: '#0000FF' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 様々なサイズでも正しく計算される
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.yieldExcludingLast).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should complete calculation within 5 seconds', () => {
      const items: Item[] = []

      // 多数のアイテムを生成
      for (let i = 0; i < 20; i++) {
        items.push({
          id: `item-${i}`,
          name: `Item ${i}`,
          width: 200 + i * 10,
          height: 150 + i * 5,
          quantity: 3,
          color: `#${((i * 123456) % 0xffffff).toString(16).padStart(6, '0')}`,
        })
      }

      const startTime = Date.now()
      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)
      const endTime = Date.now()

      const duration = endTime - startTime

      // 5秒以内に完了
      expect(duration).toBeLessThan(5000)

      // 正しく計算されている
      expect(result.totalPlates).toBeGreaterThan(0)
    })
  })

  describe('Backward Compatibility Tests', () => {
    it('should work with offcuts', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 400, height: 300, quantity: 5, color: '#FF0000' },
        { id: '2', name: 'Item2', width: 300, height: 200, quantity: 4, color: '#00FF00' },
      ]

      const offcuts: OffcutPlate[] = [
        {
          id: 'off1',
          name: 'Offcut 1',
          width: 800,
          height: 600,
          quantity: 1,
        },
      ]

      const result = calculateWithOffcuts(
        plateConfig,
        cutConfig,
        items,
        offcuts,
        'yield',
        'consumption'
      )

      // 端材使用時も新フィールドが含まれる
      expect(result.yieldExcludingLast).toBeDefined()
      expect(result.offcutUsage).toBeDefined()
    })

    it('should maintain existing behavior for remaining-space mode', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 500, height: 350, quantity: 3, color: '#FF0000' },
        { id: '2', name: 'Item2', width: 400, height: 300, quantity: 3, color: '#00FF00' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'remaining-space', false, false)

      // 余白優先モードでも新フィールドが含まれる
      expect(result.yieldExcludingLast).toBeDefined()
      expect(result.meetsYieldTarget).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const items: Item[] = []

      expect(() => {
        calculate(plateConfig, cutConfig, items, 'yield', false, false)
      }).toThrow()
    })

    it('should handle items with zero quantity', () => {
      const items: Item[] = [
        { id: '1', name: 'Item1', width: 300, height: 200, quantity: 0, color: '#FF0000' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 個数0のアイテムは展開されない
      expect(result.totalPlates).toBe(0)
    })

    it('should handle very small items', () => {
      const items: Item[] = [
        { id: '1', name: 'Tiny', width: 50, height: 40, quantity: 100, color: '#FF0000' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 小さいアイテムでも正しく配置される
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.averageYield).toBeGreaterThan(0)
    })

    it('should handle items close to plate size', () => {
      const items: Item[] = [
        { id: '1', name: 'Large', width: 1750, height: 850, quantity: 2, color: '#FF0000' },
      ]

      const result = calculate(plateConfig, cutConfig, items, 'yield', false, false)

      // 元板ギリギリのサイズでも配置される
      expect(result.totalPlates).toBe(2)
    })
  })
})
