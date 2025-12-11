import type { PatternGroup } from './result'

/**
 * 端材（余り材）の定義
 */
export interface OffcutPlate {
  id: string
  name: string
  width: number
  height: number
  quantity: number
  color?: string
}

/**
 * 端材使用情報
 */
export interface OffcutUsageInfo {
  offcut: OffcutPlate
  pattern: PatternGroup
  platesUsed: number
  placedItemIds: string[]
}

/**
 * 端材使用結果のサマリー
 */
export interface OffcutUsage {
  used: OffcutUsageInfo[]
  unused: OffcutPlate[]
  totalItemsOnOffcuts: number
  costSaved: number
}
