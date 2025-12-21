import type { Placement } from './algorithm'
import type { OffcutUsage } from './offcut'

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
  /** 端材パターンかどうか */
  isOffcut?: boolean
  /** 端材情報（端材パターンの場合） */
  offcutInfo?: {
    name: string
    size: string
    width: number
    height: number
  }
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
  /** 端材使用情報 */
  offcutUsage?: OffcutUsage

  // ===== v1.5: 新規追加フィールド =====
  /** 最後のパターンを除いた平均歩留まり率（%） */
  yieldExcludingLast?: number
  /** 最後のパターンの歩留まり率（%） */
  lastPatternYield?: number
  /** 歩留まり目標（85%以上）を達成したか */
  meetsYieldTarget?: boolean
  /** 歩留まり目標値（デフォルト: 85%） */
  targetYield?: number
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
