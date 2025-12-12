/**
 * 型定義のエントリーポイント
 * すべての型をここから export する
 */

// 設定関連の型
export type { PlateConfig, CutConfig, OffcutMode } from './config'
export { DEFAULT_PLATE_CONFIG, DEFAULT_CUT_CONFIG } from './config'

// 製品関連の型
export type { Item, ItemFormData } from './item'
export { COLOR_PALETTE } from './item'

// アルゴリズム関連の型
export type { Placement, FreeSpace, Plate, CanPlaceResult } from './algorithm'

// 結果表示関連の型
export type { PatternGroup, CalculationResult, SkippedItem, CalculationStats } from './result'

// 端材関連の型
export type { OffcutPlate, OffcutUsageInfo, OffcutUsage } from './offcut'
