import type { CalculationResult } from './result'
import type { Placement } from './algorithm'

/**
 * 編集可能な計算結果
 * Copy-on-Writeパターンで元の結果を保持
 */
export interface EditableResult extends CalculationResult {
  /** 編集済みフラグ */
  isEdited: boolean

  /** 元の計算結果（破棄時に復元） */
  originalResult: CalculationResult

  /** 変更履歴（将来のアンドゥ/リドゥ用） */
  modifications: Modification[]
}

/**
 * パターン間移動のための仮置き場
 */
export interface StagingArea {
  /** 仮置き場の製品リスト */
  products: Placement[]

  /** 製品の元パターンIDマッピング */
  sourcePatternIds: Map<string, string>
}

/**
 * スナップ候補ポイント
 */
export interface SnapPoint {
  /** X座標（mm） */
  x: number

  /** Y座標（mm） */
  y: number

  /** ポイントタイプ */
  type: 'corner' | 'edge'

  /** 元製品ID（デバッグ用） */
  sourceItemId?: string
}

/**
 * 変更履歴（将来のアンドゥ/リドゥ用）
 */
export interface Modification {
  /** 変更タイプ */
  type: 'move' | 'add' | 'remove'

  /** 対象パターンID */
  patternId: string

  /** 対象製品 */
  placement: Placement

  /** 変更前の座標（move時） */
  previousPosition?: { x: number; y: number }

  /** 変更後の座標（move時） */
  newPosition?: { x: number; y: number }

  /** タイムスタンプ */
  timestamp: Date
}
