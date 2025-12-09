import type { Item } from '@/types'

/**
 * ソート戦略の種類
 */
export type SortStrategy =
  | 'area' // 面積順
  | 'width' // 幅優先
  | 'height' // 高さ優先
  | 'long-edge' // 長辺優先
  | 'short-edge' // 短辺優先

/**
 * アスペクト比を計算する
 * 1に近いほど正方形に近い
 * @param item 製品
 * @returns アスペクト比の1からの差分
 */
function getAspectRatioDiff(item: Item): number {
  const ratio = item.width / item.height
  return Math.abs(ratio - 1)
}

/**
 * 製品を面積順にソートする
 * - 面積が大きい順（降順）
 * - 面積が同じ場合、アスペクト比が1:1に近い順
 *
 * @param items 製品のリスト
 * @returns ソート済みの製品リスト
 */
export function sortByArea(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    // 面積を計算
    const areaA = a.width * a.height
    const areaB = b.width * b.height

    // 面積が異なる場合、大きい順
    if (areaA !== areaB) {
      return areaB - areaA
    }

    // 面積が同じ場合、アスペクト比が1に近い順
    const ratioA = getAspectRatioDiff(a)
    const ratioB = getAspectRatioDiff(b)

    return ratioA - ratioB
  })
}

/**
 * 製品を幅優先でソートする
 * 幅が大きい順、幅が同じ場合は高さが大きい順
 *
 * @param items 製品のリスト
 * @returns ソート済みの製品リスト
 */
export function sortByWidth(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.width !== b.width) {
      return b.width - a.width
    }
    return b.height - a.height
  })
}

/**
 * 製品を高さ優先でソートする
 * 高さが大きい順、高さが同じ場合は幅が大きい順
 *
 * @param items 製品のリスト
 * @returns ソート済みの製品リスト
 */
export function sortByHeight(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    if (a.height !== b.height) {
      return b.height - a.height
    }
    return b.width - a.width
  })
}

/**
 * 製品を長辺優先でソートする
 * 長辺が大きい順、長辺が同じ場合は短辺が大きい順
 *
 * @param items 製品のリスト
 * @returns ソート済みの製品リスト
 */
export function sortByLongEdge(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const longA = Math.max(a.width, a.height)
    const longB = Math.max(b.width, b.height)
    const shortA = Math.min(a.width, a.height)
    const shortB = Math.min(b.width, b.height)

    if (longA !== longB) {
      return longB - longA
    }
    return shortB - shortA
  })
}

/**
 * 製品を短辺優先でソートする
 * 短辺が大きい順、短辺が同じ場合は長辺が大きい順
 *
 * @param items 製品のリスト
 * @returns ソート済みの製品リスト
 */
export function sortByShortEdge(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const shortA = Math.min(a.width, a.height)
    const shortB = Math.min(b.width, b.height)
    const longA = Math.max(a.width, a.height)
    const longB = Math.max(b.width, b.height)

    if (shortA !== shortB) {
      return shortB - shortA
    }
    return longB - longA
  })
}

/**
 * 指定された戦略で製品をソートする
 *
 * @param items 製品のリスト
 * @param strategy ソート戦略
 * @returns ソート済みの製品リスト
 */
export function sortByStrategy(items: Item[], strategy: SortStrategy): Item[] {
  switch (strategy) {
    case 'area':
      return sortByArea(items)
    case 'width':
      return sortByWidth(items)
    case 'height':
      return sortByHeight(items)
    case 'long-edge':
      return sortByLongEdge(items)
    case 'short-edge':
      return sortByShortEdge(items)
  }
}

/**
 * 製品を個数分に展開する
 * 例: {name: 'A', qty: 3} → [{name: 'A'}, {name: 'A'}, {name: 'A'}]
 * 各アイテムに一意のIDを割り当てる
 *
 * @param items 製品のリスト
 * @returns 個数分に展開された製品リスト
 */
export function expandItems(items: Item[]): Item[] {
  const expanded: Item[] = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      // 各アイテムに一意のIDを割り当てる
      expanded.push({
        ...item,
        id: `${item.id}-${i}`,
      })
    }
  }

  return expanded
}

/**
 * 製品を前処理する
 * 1. 個数分に展開
 * 2. 面積順にソート
 *
 * @param items 製品のリスト
 * @returns 前処理済みの製品リスト
 */
export function preprocessItems(items: Item[]): Item[] {
  const expanded = expandItems(items)
  return sortByArea(expanded)
}
