import type { Item, PatternGroup } from './index'

/**
 * 端材の目標サイズ
 */
export interface OffcutSize {
  width: number
  height: number
}

/**
 * 製品の交換候補
 */
export interface SwapCandidate {
  items: Item[]
  type: 'size-based' | 'random' | 'heuristic'
}

/**
 * パターン再編成の結果
 */
export interface ReorganizationResult {
  patterns: PatternGroup[]
  improvementLog: ImprovementEntry[]
}

/**
 * 改善履歴のエントリ
 */
export interface ImprovementEntry {
  iteration: number
  patternIndex: number
  oldYield: number
  newYield: number
  message: string
}
