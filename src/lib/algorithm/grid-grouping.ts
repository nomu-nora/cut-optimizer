import type { Item, FreeSpace } from '@/types'

/**
 * グリッド配置の情報
 */
export interface GridGroup {
  /** グループのID */
  id: string
  /** グループ内のアイテム */
  items: Item[]
  /** 製品の幅 */
  itemWidth: number
  /** 製品の高さ */
  itemHeight: number
  /** グリッドの行数 */
  rows: number
  /** グリッドの列数 */
  cols: number
  /** グリッド全体の幅 */
  totalWidth: number
  /** グリッド全体の高さ */
  totalHeight: number
  /** 回転させているか */
  rotated: boolean
}

/**
 * グリッド配置の候補を生成
 *
 * @param count 配置する製品数
 * @returns グリッド配置の候補リスト [(rows, cols), ...]
 */
function generateGridCandidates(count: number): Array<[number, number]> {
  const candidates: Array<[number, number]> = []

  // count個を配置できるすべての行×列の組み合わせを生成
  for (let rows = 1; rows <= count; rows++) {
    const cols = Math.ceil(count / rows)
    if (rows * cols >= count) {
      candidates.push([rows, cols])
    }
  }

  return candidates
}

/**
 * グリッド配置が空きスペースに収まるかチェック
 *
 * @param gridWidth グリッドの幅
 * @param gridHeight グリッドの高さ
 * @param space 空きスペース
 * @param cutWidth 切断幅
 * @returns 収まるかどうか
 */
function fitsInSpace(
  gridWidth: number,
  gridHeight: number,
  space: FreeSpace,
  cutWidth: number
): boolean {
  return gridWidth <= space.width && gridHeight <= space.height
}

/**
 * 同じサイズのアイテムをグループ化
 *
 * @param items アイテムリスト
 * @param minGroupSize 最小グループサイズ（この数以上あるグループのみ作成）
 * @returns サイズごとのアイテムグループ
 */
export function groupItemsBySize(
  items: Item[],
  minGroupSize: number = 4
): Map<string, Item[]> {
  const groups = new Map<string, Item[]>()

  for (const item of items) {
    const key = `${item.width}x${item.height}`
    const group = groups.get(key) || []
    group.push(item)
    groups.set(key, group)
  }

  // 最小グループサイズ未満のグループを除外
  for (const [key, group] of groups.entries()) {
    if (group.length < minGroupSize) {
      groups.delete(key)
    }
  }

  return groups
}

/**
 * グリッド配置の最適な構成を計算
 *
 * @param items 同じサイズのアイテムリスト
 * @param space 配置する空きスペース
 * @param cutWidth 切断幅
 * @param optimizeFor 'compact' | 'remaining-space'
 * @returns 最適なグリッド配置（収まらない場合はnull）
 */
export function calculateOptimalGrid(
  items: Item[],
  space: FreeSpace,
  cutWidth: number,
  optimizeFor: 'compact' | 'remaining-space' = 'compact'
): GridGroup | null {
  if (items.length === 0) return null

  const item = items[0]
  const candidates = generateGridCandidates(items.length)

  let bestGrid: GridGroup | null = null
  let bestScore = -Infinity

  for (const [rows, cols] of candidates) {
    // 実際に配置する製品数（グリッドサイズが製品数より大きい場合もある）
    const actualCount = Math.min(rows * cols, items.length)

    // 通常の向きと回転の両方を試す
    for (const rotated of [false, true]) {
      const itemWidth = rotated ? item.height : item.width
      const itemHeight = rotated ? item.width : item.height

      // グリッド全体のサイズ計算（切断幅を考慮）
      const totalWidth = cols * itemWidth + (cols - 1) * cutWidth
      const totalHeight = rows * itemHeight + (rows - 1) * cutWidth

      // 空きスペースに収まるかチェック
      if (!fitsInSpace(totalWidth, totalHeight, space, cutWidth)) {
        continue
      }

      // スコア計算
      let score = 0

      if (optimizeFor === 'compact') {
        // コンパクト優先: より正方形に近い配置を好む
        const aspectRatio = Math.max(totalWidth, totalHeight) / Math.min(totalWidth, totalHeight)
        score = actualCount * 100 - aspectRatio * 10
      } else {
        // 余りスペース優先: 余りスペースが整った形状になる配置を好む
        const remainingWidth = space.width - totalWidth
        const remainingHeight = space.height - totalHeight
        const remainingArea = remainingWidth * space.height + remainingHeight * totalWidth
        score = actualCount * 100 + remainingArea * 0.01
      }

      if (score > bestScore) {
        bestScore = score
        bestGrid = {
          id: `grid-${item.width}x${item.height}-${rows}x${cols}`,
          items: items.slice(0, actualCount),
          itemWidth,
          itemHeight,
          rows,
          cols,
          totalWidth,
          totalHeight,
          rotated,
        }
      }
    }
  }

  return bestGrid
}

/**
 * グリッドグループをアイテムリストに展開
 * グループ化されたアイテムを除外し、グループ化されなかったアイテムのみを返す
 *
 * @param items 元のアイテムリスト
 * @param gridGroups グリッドグループリスト
 * @returns グループ化されなかったアイテムのリスト
 */
export function extractUngroupedItems(
  items: Item[],
  gridGroups: GridGroup[]
): Item[] {
  const groupedItemIds = new Set<string>()

  for (const grid of gridGroups) {
    for (const item of grid.items) {
      groupedItemIds.add(item.id)
    }
  }

  return items.filter((item) => !groupedItemIds.has(item.id))
}
