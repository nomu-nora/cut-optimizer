import type { Item } from '@/types'

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
 * 製品を個数分に展開する
 * 例: {name: 'A', qty: 3} → [{name: 'A'}, {name: 'A'}, {name: 'A'}]
 *
 * @param items 製品のリスト
 * @returns 個数分に展開された製品リスト
 */
export function expandItems(items: Item[]): Item[] {
  const expanded: Item[] = []

  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      expanded.push(item)
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
