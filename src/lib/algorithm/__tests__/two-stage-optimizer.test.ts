import { describe, it, expect } from '@jest/globals'
import type { PlateConfig, CutConfig, Item } from '@/types'
import {
  calculateWithTwoStageOptimization,
  extractAllItemsFromPatterns,
  extractItemsFromPattern,
  rebuildCalculationResult,
} from '../two-stage-optimizer'

describe('Two-Stage Optimizer', () => {
  const plateConfig: PlateConfig = {
    width: 1820,
    height: 910,
    unitPrice: 5000,
  }

  const cutConfig: CutConfig = {
    cutWidth: 4,
    margin: 20,
  }

  const testItems: Item[] = [
    { id: '1', name: 'A', width: 400, height: 300, quantity: 2, color: '#FF0000' },
    { id: '2', name: 'B', width: 600, height: 400, quantity: 2, color: '#00FF00' },
    { id: '3', name: 'C', width: 300, height: 200, quantity: 3, color: '#0000FF' },
    { id: '4', name: 'D', width: 500, height: 350, quantity: 1, color: '#FFFF00' },
  ]

  describe('calculateWithTwoStageOptimization', () => {
    it('歩留まり優先モードで2段階最適化を実行', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'yield',
        false
      )

      expect(result).toBeDefined()
      expect(result.patterns.length).toBeGreaterThan(0)
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.averageYield).toBeGreaterThan(0)
      expect(result.averageYield).toBeLessThanOrEqual(100)

      // v1.5メトリクスが存在することを確認
      expect(result.yieldExcludingLast).toBeDefined()
      expect(result.lastPatternYield).toBeDefined()
      expect(result.meetsYieldTarget).toBeDefined()
      expect(result.targetYield).toBe(85)
    })

    it('スペース優先モードで2段階最適化を実行', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'remaining-space',
        false
      )

      expect(result).toBeDefined()
      expect(result.patterns.length).toBeGreaterThan(0)
      expect(result.totalPlates).toBeGreaterThan(0)
      expect(result.averageYield).toBeGreaterThan(0)
      expect(result.averageYield).toBeLessThanOrEqual(100)
    })

    it('全製品が配置されることを確認', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'yield',
        false
      )

      const totalInputQuantity = testItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPlacedQuantity = result.patterns
        .filter((p) => !p.isOffcut)
        .reduce((sum, pattern) => {
          return sum + pattern.placements.length * pattern.count
        }, 0)

      expect(totalPlacedQuantity).toBe(totalInputQuantity)
    })
  })

  describe('extractAllItemsFromPatterns', () => {
    it('パターンから全製品を抽出（count考慮）', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'yield',
        false
      )

      const extracted = extractAllItemsFromPatterns(result.patterns.filter((p) => !p.isOffcut))

      const totalInputQuantity = testItems.reduce((sum, item) => sum + item.quantity, 0)
      expect(extracted.length).toBe(totalInputQuantity)
    })
  })

  describe('extractItemsFromPattern', () => {
    it('単一パターンから製品を抽出', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'yield',
        false
      )

      const firstPattern = result.patterns[0]
      const extracted = extractItemsFromPattern(firstPattern)

      expect(extracted.length).toBe(firstPattern.placements.length)
    })
  })

  describe('rebuildCalculationResult', () => {
    it('パターンから計算結果を再構築', () => {
      const originalResult = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'yield',
        false
      )

      const rebuilt = rebuildCalculationResult(originalResult.patterns, originalResult, plateConfig)

      expect(rebuilt.totalPlates).toBe(originalResult.totalPlates)
      expect(rebuilt.patterns.length).toBe(originalResult.patterns.length)
      expect(rebuilt.averageYield).toBeCloseTo(originalResult.averageYield, 1)
    })
  })

  describe('歩留まり改善の検証', () => {
    it('2段階最適化で歩留まりが維持されることを確認', () => {
      const largeItems: Item[] = [
        { id: '1', name: 'Large1', width: 800, height: 600, quantity: 3, color: '#FF0000' },
        { id: '2', name: 'Large2', width: 700, height: 500, quantity: 3, color: '#00FF00' },
        { id: '3', name: 'Medium1', width: 400, height: 300, quantity: 4, color: '#0000FF' },
        { id: '4', name: 'Medium2', width: 500, height: 350, quantity: 4, color: '#FFFF00' },
      ]

      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        largeItems,
        'yield',
        false
      )

      expect(result.averageYield).toBeGreaterThan(55)

      // パターンが複数ある場合、最後を除いた歩留まりをチェック
      const regularPatterns = result.patterns.filter((p) => !p.isOffcut)
      if (regularPatterns.length > 1) {
        expect(result.yieldExcludingLast).toBeGreaterThan(0)
      }
    })
  })

  describe('端材スペース最適化の検証', () => {
    it('スペース優先モードで端材が考慮されることを確認', () => {
      const result = calculateWithTwoStageOptimization(
        plateConfig,
        cutConfig,
        testItems,
        'remaining-space',
        false
      )

      // スペース優先でも基本的な配置が行われる
      expect(result.patterns.length).toBeGreaterThan(0)
      expect(result.totalPlates).toBeGreaterThan(0)

      // 全製品が配置される
      const totalInputQuantity = testItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPlacedQuantity = result.patterns
        .filter((p) => !p.isOffcut)
        .reduce((sum, pattern) => sum + pattern.placements.length * pattern.count, 0)

      expect(totalPlacedQuantity).toBe(totalInputQuantity)
    })
  })
})
