/**
 * 元板設定の型定義
 */
export interface PlateConfig {
  /** 元板の幅（mm） */
  width: number
  /** 元板の高さ（mm） */
  height: number
  /** 元板の単価（円）- 任意 */
  unitPrice: number
}

/**
 * 切断設定の型定義
 */
export interface CutConfig {
  /** カット幅（刃の幅）（mm） */
  cutWidth: number
  /** 両端余白（mm）- 上下左右すべての辺に適用 */
  margin: number
}

/**
 * デフォルト設定値
 */
export const DEFAULT_PLATE_CONFIG: PlateConfig = {
  width: 1820, // サブロク板
  height: 910,
  unitPrice: 0,
}

export const DEFAULT_CUT_CONFIG: CutConfig = {
  cutWidth: 4, // 4mm
  margin: 20, // 20mm
}
