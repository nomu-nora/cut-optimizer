import type { Item } from './item'

/**
 * 配置された製品の情報
 */
export interface Placement {
  /** 元の製品情報 */
  item: Item
  /** 配置位置X座標（左上）（mm） */
  x: number
  /** 配置位置Y座標（左上）（mm） */
  y: number
  /** 配置時の幅（回転考慮）（mm） */
  width: number
  /** 配置時の高さ（回転考慮）（mm） */
  height: number
  /** 90度回転したかどうか */
  rotated: boolean
}

/**
 * 空きスペースの情報
 */
export interface FreeSpace {
  /** 左上X座標（mm） */
  x: number
  /** 左上Y座標（mm） */
  y: number
  /** 幅（mm） */
  width: number
  /** 高さ（mm） */
  height: number
}

/**
 * 元板（計算結果）の情報
 */
export interface Plate {
  /** 元板ID */
  id: string
  /** 配置された製品のリスト */
  placements: Placement[]
  /** 歩留まり率（%） */
  yield: number
  /** 使用面積（mm²） */
  usedArea: number
  /** 空きスペースのリスト（計算中に使用） */
  freeSpaces: FreeSpace[]
}

/**
 * 配置可能性の判定結果
 */
export interface CanPlaceResult {
  /** 配置可能かどうか */
  canPlace: boolean
  /** 配置する場合に回転するか */
  rotated: boolean
  /** 配置後の最大空きスペースの面積（mm²） */
  maxSpaceArea?: number
}
