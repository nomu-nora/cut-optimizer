import type { Placement, CutConfig, SnapPoint } from '@/types'
import { checkCollision } from '@/lib/validation/placement-validation'

/**
 * パターン内の全製品からスナップポイントを生成
 * @param placements 配置リスト
 * @param cutConfig 切断設定
 * @param plateWidth 元板の幅
 * @param plateHeight 元板の高さ
 * @returns スナップポイント配列
 */
export function generateSnapPoints(
  placements: Placement[],
  cutConfig: CutConfig,
  plateWidth: number,
  plateHeight: number
): SnapPoint[] {
  const points: SnapPoint[] = []
  const gap = cutConfig.cutWidth

  // 元板の4つの角にスナップポイントを追加（余白位置）
  const margin = cutConfig.margin
  points.push(
    { x: margin, y: margin, type: 'corner' }, // 左上
    { x: plateWidth - margin, y: margin, type: 'corner' }, // 右上
    { x: margin, y: plateHeight - margin, type: 'corner' }, // 左下
    { x: plateWidth - margin, y: plateHeight - margin, type: 'corner' } // 右下
  )

  for (const p of placements) {
    // 製品の実際の4つの角（製品を重ねる場合に使用）
    points.push(
      { x: p.x, y: p.y, type: 'corner', sourceItemId: p.item.id },
      { x: p.x + p.width, y: p.y, type: 'corner', sourceItemId: p.item.id },
      { x: p.x, y: p.y + p.height, type: 'corner', sourceItemId: p.item.id },
      { x: p.x + p.width, y: p.y + p.height, type: 'corner', sourceItemId: p.item.id }
    )

    // 刃幅を考慮した配置可能位置（製品を隣接配置する場合に使用）
    // 左辺の左側（他の製品の右端がここに配置される）
    points.push({ x: p.x - gap, y: p.y, type: 'corner' })
    points.push({ x: p.x - gap, y: p.y + p.height, type: 'corner' })

    // 右辺の右側（他の製品の左端がここに配置される）
    points.push({ x: p.x + p.width + gap, y: p.y, type: 'corner' })
    points.push({ x: p.x + p.width + gap, y: p.y + p.height, type: 'corner' })

    // 上辺の上側（他の製品の下端がここに配置される）
    points.push({ x: p.x, y: p.y - gap, type: 'corner' })
    points.push({ x: p.x + p.width, y: p.y - gap, type: 'corner' })

    // 下辺の下側（他の製品の上端がここに配置される）
    points.push({ x: p.x, y: p.y + p.height + gap, type: 'corner' })
    points.push({ x: p.x + p.width, y: p.y + p.height + gap, type: 'corner' })
  }

  // 重複するスナップポイントを排除（同じ座標のポイントは1つだけにする）
  const uniquePoints: SnapPoint[] = []
  const seenCoords = new Set<string>()

  for (const point of points) {
    const key = `${point.x},${point.y}`
    if (!seenCoords.has(key)) {
      seenCoords.add(key)
      uniquePoints.push(point)
    }
  }

  return uniquePoints
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
 * 製品の4つの角から最も近いスナップポイントを検索
 * @param x 製品の左上X座標
 * @param y 製品の左上Y座標
 * @param width 製品の幅
 * @param height 製品の高さ
 * @param snapPoints スナップポイント配列
 * @param threshold スナップ閾値（mm）
 * @param placement ドラッグ中の製品配置（衝突チェック用）
 * @param otherPlacements 他の配置リスト（衝突チェック用）
 * @param cutConfig 切断設定（衝突チェック用）
 * @returns スナップ結果（新しい左上座標）
 */
export function findNearestSnapPointForProduct(
  x: number,
  y: number,
  width: number,
  height: number,
  snapPoints: SnapPoint[],
  threshold: number,
  placement: Placement,
  otherPlacements: Placement[],
  cutConfig: CutConfig
): { x: number; y: number; snapPoint: SnapPoint } | null {
  // 4つの角の座標とオフセット
  const corners = [
    { x: x, y: y, offsetX: 0, offsetY: 0, name: 'topLeft' },
    { x: x + width, y: y, offsetX: width, offsetY: 0, name: 'topRight' },
    { x: x, y: y + height, offsetX: 0, offsetY: height, name: 'bottomLeft' },
    { x: x + width, y: y + height, offsetX: width, offsetY: height, name: 'bottomRight' },
  ]

  // 各角から最も近いスナップポイントを探す
  const cornerSnaps = corners
    .map((corner) => {
      let nearest: { point: SnapPoint; dist: number } | null = null
      for (const point of snapPoints) {
        const dist = Math.sqrt(Math.pow(point.x - corner.x, 2) + Math.pow(point.y - corner.y, 2))
        if (dist < threshold && (!nearest || dist < nearest.dist)) {
          nearest = { point, dist }
        }
      }
      return nearest ? { corner, snapPoint: nearest.point, dist: nearest.dist } : null
    })
    .filter((snap) => snap !== null)

  if (cornerSnaps.length === 0) return null

  // 辺のスナップを検出（X軸とY軸を独立して処理）
  const topLeft = cornerSnaps.find((s) => s!.corner.name === 'topLeft')
  const topRight = cornerSnaps.find((s) => s!.corner.name === 'topRight')
  const bottomLeft = cornerSnaps.find((s) => s!.corner.name === 'bottomLeft')
  const bottomRight = cornerSnaps.find((s) => s!.corner.name === 'bottomRight')

  console.log('Corner snaps:', {
    topLeft: topLeft ? { snap: topLeft.snapPoint, dist: topLeft.dist } : null,
    topRight: topRight ? { snap: topRight.snapPoint, dist: topRight.dist } : null,
    bottomLeft: bottomLeft ? { snap: bottomLeft.snapPoint, dist: bottomLeft.dist } : null,
    bottomRight: bottomRight ? { snap: bottomRight.snapPoint, dist: bottomRight.dist } : null,
  })

  // X軸方向のスナップ（左辺または右辺のX座標が揃う）
  let snapX: number | null = null
  let snapY: number | null = null

  // 左辺のX座標がスナップ（左上と左下の両方、または片方）
  if (topLeft && bottomLeft) {
    if (Math.abs(topLeft.snapPoint.x - bottomLeft.snapPoint.x) < 1) {
      // 両方が同じX座標にスナップ → 完全な辺スナップ（最優先）
      snapX = topLeft.snapPoint.x
      console.log('✓ Left edge X fully aligned:', snapX)
    } else {
      // X座標が異なる → 非常に近い方（5mm以内）を優先、そうでなければ最も近い方
      const veryCloseThreshold = 5
      if (topLeft.dist < veryCloseThreshold) {
        snapX = topLeft.snapPoint.x
        console.log('✓ Top-left X very close:', snapX, 'dist:', topLeft.dist)
      } else if (bottomLeft.dist < veryCloseThreshold) {
        snapX = bottomLeft.snapPoint.x
        console.log('✓ Bottom-left X very close:', snapX, 'dist:', bottomLeft.dist)
      } else {
        snapX = topLeft.dist < bottomLeft.dist ? topLeft.snapPoint.x : bottomLeft.snapPoint.x
        console.log('✓ Left edge X partially aligned:', snapX)
      }
    }
  } else if (topLeft) {
    snapX = topLeft.snapPoint.x
    console.log('✓ Top-left X aligned:', snapX)
  } else if (bottomLeft) {
    snapX = bottomLeft.snapPoint.x
    console.log('✓ Bottom-left X aligned:', snapX)
  }

  // 右辺のX座標がスナップ（優先度は左辺より低い）
  if (!snapX && (topRight || bottomRight)) {
    if (topRight && bottomRight) {
      if (Math.abs(topRight.snapPoint.x - bottomRight.snapPoint.x) < 1) {
        snapX = topRight.snapPoint.x - width
        console.log('✓ Right edge X aligned:', snapX)
      } else {
        const nearest = topRight.dist < bottomRight.dist ? topRight : bottomRight
        snapX = nearest.snapPoint.x - width
        console.log('✓ Right edge X partially aligned:', snapX)
      }
    } else if (topRight) {
      snapX = topRight.snapPoint.x - width
      console.log('✓ Top-right X aligned:', snapX)
    } else if (bottomRight) {
      snapX = bottomRight.snapPoint.x - width
      console.log('✓ Bottom-right X aligned:', snapX)
    }
  }

  // Y軸方向のスナップ（上辺または下辺のY座標が揃う）
  // 上辺のY座標がスナップ
  if (topLeft && topRight) {
    if (Math.abs(topLeft.snapPoint.y - topRight.snapPoint.y) < 1) {
      // 両方が同じY座標にスナップ → 完全な辺スナップ（最優先）
      snapY = topLeft.snapPoint.y
      console.log('✓ Top edge Y fully aligned:', snapY)
    } else {
      // Y座標が異なる → 非常に近い方（5mm以内）を優先
      const veryCloseThreshold = 5
      if (topLeft.dist < veryCloseThreshold) {
        snapY = topLeft.snapPoint.y
        console.log('✓ Top-left Y very close:', snapY, 'dist:', topLeft.dist)
      } else if (topRight.dist < veryCloseThreshold) {
        snapY = topRight.snapPoint.y
        console.log('✓ Top-right Y very close:', snapY, 'dist:', topRight.dist)
      } else {
        const nearest = topLeft.dist < topRight.dist ? topLeft : topRight
        snapY = nearest.snapPoint.y
        console.log('✓ Top edge Y partially aligned:', snapY)
      }
    }
  } else if (topLeft) {
    snapY = topLeft.snapPoint.y
    console.log('✓ Top-left Y aligned:', snapY)
  } else if (topRight) {
    snapY = topRight.snapPoint.y
    console.log('✓ Top-right Y aligned:', snapY)
  }

  // 下辺のY座標がスナップ（優先度は上辺より低い）
  if (!snapY && (bottomLeft || bottomRight)) {
    if (bottomLeft && bottomRight) {
      if (Math.abs(bottomLeft.snapPoint.y - bottomRight.snapPoint.y) < 1) {
        snapY = bottomLeft.snapPoint.y - height
        console.log('✓ Bottom edge Y aligned:', snapY)
      } else {
        const nearest = bottomLeft.dist < bottomRight.dist ? bottomLeft : bottomRight
        snapY = nearest.snapPoint.y - height
        console.log('✓ Bottom edge Y partially aligned:', snapY)
      }
    } else if (bottomLeft) {
      snapY = bottomLeft.snapPoint.y - height
      console.log('✓ Bottom-left Y aligned:', snapY)
    } else if (bottomRight) {
      snapY = bottomRight.snapPoint.y - height
      console.log('✓ Bottom-right Y aligned:', snapY)
    }
  }

  // X軸またはY軸のスナップがある場合、その位置を返す
  if (snapX !== null || snapY !== null) {
    const finalX = snapX !== null ? snapX : x
    const finalY = snapY !== null ? snapY : y
    const snapPoint =
      topLeft?.snapPoint || topRight?.snapPoint || bottomLeft?.snapPoint || bottomRight!.snapPoint

    // 衝突チェック: この位置に配置した場合、刃幅が重ならないかをチェック
    const testPlacement: Placement = {
      ...placement,
      x: finalX,
      y: finalY,
    }

    // 刃幅を考慮した衝突判定
    if (checkCollision(testPlacement, otherPlacements, cutConfig)) {
      console.log('Snap rejected: would cause blade width overlap at', { x: finalX, y: finalY })
      return null
    }

    console.log('Snap result:', { x: finalX, y: finalY })
    return { x: finalX, y: finalY, snapPoint }
  }

  // スナップポイントが見つからない
  console.log('No snap')
  return null
}

/**
 * スナップ閾値を取得（デバイスに応じて調整）
 * @returns スナップ閾値（mm）
 */
export function getSnapThreshold(): number {
  // タッチデバイスの判定
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // デスクトップ: 30mm、タッチデバイス: 50mm (閾値を大きくして吸着しやすく)
  return isTouchDevice ? 50 : 30
}
