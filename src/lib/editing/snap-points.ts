import type { Placement, CutConfig, SnapPoint } from '@/types'

/**
 * パターン内の全製品からスナップポイントを生成
 * @param placements 配置リスト
 * @param cutConfig 切断設定
 * @returns スナップポイント配列
 */
export function generateSnapPoints(placements: Placement[], cutConfig: CutConfig): SnapPoint[] {
  const points: SnapPoint[] = []
  const gap = cutConfig.cutWidth

  // 元板の境界にもスナップポイントを追加（余白位置）
  const margin = cutConfig.margin
  points.push({ x: margin, y: margin, type: 'corner' }, { x: margin, y: margin, type: 'corner' })

  for (const p of placements) {
    // 4つの角
    points.push(
      { x: p.x, y: p.y, type: 'corner', sourceItemId: p.item.id },
      { x: p.x + p.width, y: p.y, type: 'corner', sourceItemId: p.item.id },
      { x: p.x, y: p.y + p.height, type: 'corner', sourceItemId: p.item.id },
      { x: p.x + p.width, y: p.y + p.height, type: 'corner', sourceItemId: p.item.id }
    )

    // 刃幅オフセット（8ポイント）
    points.push(
      { x: p.x - gap, y: p.y, type: 'corner' },
      { x: p.x + p.width + gap, y: p.y, type: 'corner' },
      { x: p.x - gap, y: p.y + p.height, type: 'corner' },
      { x: p.x + p.width + gap, y: p.y + p.height, type: 'corner' },
      { x: p.x, y: p.y - gap, type: 'corner' },
      { x: p.x + p.width, y: p.y - gap, type: 'corner' },
      { x: p.x, y: p.y + p.height + gap, type: 'corner' },
      { x: p.x + p.width, y: p.y + p.height + gap, type: 'corner' }
    )
  }

  return points
}

/**
 * 空間ハッシュ用のグリッドクラス
 * O(1)で最近接ポイントを検索するための空間分割
 */
export class SpatialHashGrid {
  private cellSize: number
  private grid: Map<string, SnapPoint[]>

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  /**
   * ポイントを追加
   */
  addPoint(point: SnapPoint): void {
    const key = this.getKey(point.x, point.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(point)
  }

  /**
   * 複数のポイントを一括追加
   */
  addPoints(points: SnapPoint[]): void {
    for (const point of points) {
      this.addPoint(point)
    }
  }

  /**
   * 指定座標の近くのポイントを検索
   * @param x X座標
   * @param y Y座標
   * @param threshold スナップ閾値（mm）
   * @returns 最近接ポイント（見つからない場合はnull）
   */
  findNearby(x: number, y: number, threshold: number): SnapPoint | null {
    const cellsToCheck = Math.ceil(threshold / this.cellSize)
    let nearest: SnapPoint | null = null
    let minDist = threshold

    for (let dx = -cellsToCheck; dx <= cellsToCheck; dx++) {
      for (let dy = -cellsToCheck; dy <= cellsToCheck; dy++) {
        const key = this.getKey(x + dx * this.cellSize, y + dy * this.cellSize)
        const points = this.grid.get(key)
        if (!points) continue

        for (const point of points) {
          const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
          if (dist < minDist) {
            minDist = dist
            nearest = point
          }
        }
      }
    }

    return nearest
  }

  /**
   * グリッドをクリア
   */
  clear(): void {
    this.grid.clear()
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }
}

/**
 * 最近接スナップポイントを検索（線形探索版）
 * @param x X座標
 * @param y Y座標
 * @param snapPoints スナップポイント配列
 * @param threshold スナップ閾値（mm）
 * @returns 最近接ポイント（見つからない場合はnull）
 */
export function findNearestSnapPoint(
  x: number,
  y: number,
  snapPoints: SnapPoint[],
  threshold: number
): SnapPoint | null {
  let nearest: SnapPoint | null = null
  let minDist = threshold

  for (const point of snapPoints) {
    const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
    if (dist < minDist) {
      minDist = dist
      nearest = point
    }
  }

  return nearest
}

/**
 * スナップ閾値を取得（デバイスに応じて調整）
 * @returns スナップ閾値（mm）
 */
export function getSnapThreshold(): number {
  // タッチデバイスの判定
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // デスクトップ: 10mm、タッチデバイス: 20mm
  return isTouchDevice ? 20 : 10
}
