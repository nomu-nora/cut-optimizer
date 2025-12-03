import { describe, it, expect } from '@jest/globals'
import { sortByArea, expandItems, preprocessItems } from '../sort'
import type { Item } from '@/types'

describe('sortByArea', () => {
  it('should sort items by area in descending order', () => {
    const items: Item[] = [
      { id: '1', name: 'Small', width: 100, height: 100, quantity: 1, color: '#FF0000' }, // 10,000
      { id: '2', name: 'Large', width: 500, height: 400, quantity: 1, color: '#00FF00' }, // 200,000
      { id: '3', name: 'Medium', width: 300, height: 200, quantity: 1, color: '#0000FF' }, // 60,000
    ]

    const sorted = sortByArea(items)

    expect(sorted[0].name).toBe('Large')
    expect(sorted[1].name).toBe('Medium')
    expect(sorted[2].name).toBe('Small')
  })

  it('should sort items with same area by aspect ratio (closer to 1:1)', () => {
    const items: Item[] = [
      { id: '1', name: 'Wide', width: 800, height: 200, quantity: 1, color: '#FF0000' }, // 160,000, ratio 4.0
      { id: '2', name: 'Square', width: 400, height: 400, quantity: 1, color: '#00FF00' }, // 160,000, ratio 1.0
      { id: '3', name: 'Tall', width: 200, height: 800, quantity: 1, color: '#0000FF' }, // 160,000, ratio 0.25
    ]

    const sorted = sortByArea(items)

    // Same area, so should be sorted by aspect ratio (closer to 1.0)
    expect(sorted[0].name).toBe('Square') // ratio 1.0 (diff 0)
    expect(sorted[1].name).toBe('Tall') // ratio 0.25 (diff 0.75)
    expect(sorted[2].name).toBe('Wide') // ratio 4.0 (diff 3.0)
  })
})

describe('expandItems', () => {
  it('should expand items based on quantity', () => {
    const items: Item[] = [
      { id: '1', name: 'A', width: 100, height: 100, quantity: 3, color: '#FF0000' },
      { id: '2', name: 'B', width: 200, height: 200, quantity: 2, color: '#00FF00' },
    ]

    const expanded = expandItems(items)

    expect(expanded).toHaveLength(5) // 3 + 2
    expect(expanded.filter((item) => item.name === 'A')).toHaveLength(3)
    expect(expanded.filter((item) => item.name === 'B')).toHaveLength(2)
  })

  it('should return empty array for empty input', () => {
    const expanded = expandItems([])
    expect(expanded).toHaveLength(0)
  })
})

describe('preprocessItems', () => {
  it('should expand and sort items', () => {
    const items: Item[] = [
      { id: '1', name: 'Small', width: 100, height: 100, quantity: 2, color: '#FF0000' }, // 10,000
      { id: '2', name: 'Large', width: 500, height: 400, quantity: 1, color: '#00FF00' }, // 200,000
    ]

    const processed = preprocessItems(items)

    expect(processed).toHaveLength(3) // 2 + 1
    expect(processed[0].name).toBe('Large') // Largest first
    expect(processed[1].name).toBe('Small')
    expect(processed[2].name).toBe('Small')
  })
})
