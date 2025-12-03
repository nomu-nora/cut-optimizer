/**
 * アルゴリズムのエントリーポイント
 * Guillotine Cut + First Fit Decreasing アルゴリズムの実装
 */

// メイン計算関数
export { calculate } from './guillotine'

// ユーティリティ関数（テスト用にエクスポート）
export { sortByArea, expandItems, preprocessItems } from './sort'
export { canPlace, decideRotation } from './placement'
export { splitSpace, getMaxSpace, sortSpacesByArea } from './space'
export {
  calculateYield,
  calculateEffectiveArea,
  calculateAverageYield,
  calculateItemArea,
} from './yield'
export { groupPatterns, getTotalPlatesFromPatterns } from './pattern'
