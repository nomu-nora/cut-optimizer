/**
 * 製品（アイテム）の型定義
 */
export interface Item {
  /** 一意のID（UUID） */
  id: string
  /** 製品名 */
  name: string
  /** 幅（mm） */
  width: number
  /** 高さ（mm） */
  height: number
  /** 必要個数 */
  quantity: number
  /** 表示色（hex） */
  color: string
}

/**
 * 製品入力フォームの型
 */
export interface ItemFormData {
  name: string
  width: string
  height: string
  quantity: string
}

/**
 * 製品の色パレット
 * 視覚的に区別しやすい色のセット
 */
export const COLOR_PALETTE = [
  '#FF6B6B', // 赤
  '#4ECDC4', // 水色
  '#45B7D1', // 青
  '#FFA07A', // オレンジ
  '#98D8C8', // 緑
  '#F7DC6F', // 黄色
  '#BB8FCE', // 紫
  '#85C1E2', // ライトブルー
  '#F8B739', // ゴールド
  '#52B788', // エメラルド
  '#E76F51', // コーラル
  '#2A9D8F', // ティール
] as const
