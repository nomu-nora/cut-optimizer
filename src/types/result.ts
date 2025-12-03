import type { Placement } from './algorithm'

/**
 * パターングループの情報
 * 同じ配置パターンをまとめたもの
 */
export interface PatternGroup {
  /** パターンID（A, B, C...） */
  patternId: string
  /** 配置パターン */
  placements: Placement[]
  /** 同じパターンの枚数 */
  count: number
  /** 歩留まり率（%） */
  yield: number
}

/**
 * 計算結果の情報
 */
export interface CalculationResult {
  /** パターングループのリスト（枚数が多い順） */
  patterns: PatternGroup[]
  /** 必要元板枚数の合計 */
  totalPlates: number
  /** 平均歩留まり率（%） */
  averageYield: number
  /** 総コスト（円） */
  totalCost: number
  /** 計算されなかった製品（元板より大きい製品など） */
  skippedItems?: SkippedItem[]
}

/**
 * スキップされた製品の情報
 */
export interface SkippedItem {
  /** 製品ID */
  itemId: string
  /** 製品名 */
  itemName: string
  /** スキップ理由 */
  reason: 'TOO_LARGE' | 'OTHER'
  /** 詳細メッセージ */
  message: string
}

/**
 * 計算統計情報
 */
export interface CalculationStats {
  /** 計算開始時刻 */
  startTime: Date
  /** 計算終了時刻 */
  endTime: Date
  /** 計算時間（ミリ秒） */
  duration: number
  /** 処理した製品数 */
  processedItems: number
  /** 生成された元板数 */
  generatedPlates: number
}
