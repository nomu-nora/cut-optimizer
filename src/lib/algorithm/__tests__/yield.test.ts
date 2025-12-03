import { describe, it, expect } from '@jest/globals'
import {
  calculateEffectiveArea,
  calculateYield,
  calculateAverageYield,
  calculateItemArea,
} from '../yield'
import type { Plate, PlateConfig, CutConfig } from '@/types'

describe('calculateEffectiveArea', () => {
  it('should calculate effective area correctly', () => {
    const plateConfig: PlateConfig = {
      width: 1820,
      height: 910,
      unitPrice: 2000,
    }
    const cutConfig: CutConfig = {
      cutWidth: 4,
      margin: 20,
    }

    const effectiveArea = calculateEffectiveArea(plateConfig, cutConfig)

    // 有効幅 = 1820 - (20 * 2) = 1780
    // 有効高さ = 910 - (20 * 2) = 870
    // 有効面積 = 1780 * 870 = 1,548,600
    expect(effectiveArea).toBe(1548600)
  })
})

describe('calculateYield', () => {
  it('should calculate yield percentage correctly', () => {
    const plate: Plate = {
      id: '1',
      placements: [],
      yield: 0,
      usedArea: 1000000, // 1,000,000 mm²
      freeSpaces: [],
    }
    const plateConfig: PlateConfig = {
      width: 1820,
      height: 910,
      unitPrice: 2000,
    }
    const cutConfig: CutConfig = {
      cutWidth: 4,
      margin: 20,
    }

    const yieldPercentage = calculateYield(plate, plateConfig, cutConfig)

    // 有効面積 = 1,548,600
    // 歩留まり率 = 1,000,000 / 1,548,600 * 100 ≈ 64.57%
    expect(yieldPercentage).toBeCloseTo(64.57, 1)
  })

  it('should return 0 for empty effective area', () => {
    const plate: Plate = {
      id: '1',
      placements: [],
      yield: 0,
      usedArea: 0,
      freeSpaces: [],
    }
    const plateConfig: PlateConfig = {
      width: 0,
      height: 0,
      unitPrice: 0,
    }
    const cutConfig: CutConfig = {
      cutWidth: 4,
      margin: 20,
    }

    const yieldPercentage = calculateYield(plate, plateConfig, cutConfig)
    expect(yieldPercentage).toBe(0)
  })
})

describe('calculateAverageYield', () => {
  it('should calculate average yield correctly', () => {
    const plates: Plate[] = [
      {
        id: '1',
        placements: [],
        yield: 80.0,
        usedArea: 0,
        freeSpaces: [],
      },
      {
        id: '2',
        placements: [],
        yield: 90.0,
        usedArea: 0,
        freeSpaces: [],
      },
      {
        id: '3',
        placements: [],
        yield: 85.0,
        usedArea: 0,
        freeSpaces: [],
      },
    ]

    const average = calculateAverageYield(plates)

    // 平均 = (80 + 90 + 85) / 3 = 85
    expect(average).toBe(85)
  })

  it('should return 0 for empty array', () => {
    const average = calculateAverageYield([])
    expect(average).toBe(0)
  })
})

describe('calculateItemArea', () => {
  it('should calculate item area correctly', () => {
    const area = calculateItemArea(300, 200)
    expect(area).toBe(60000)
  })
})
