/**
 * 編集履歴管理ユーティリティ
 */

import type {
  EditableResult,
  StagingArea,
  HistorySnapshot,
  HistoryState,
  HistorySnapshotReason,
} from '@/types/editing'

/**
 * オブジェクトのDeep Copy
 * @param obj コピー対象
 * @returns コピーされたオブジェクト
 */
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * スナップショットを作成
 * @param editableResult 編集中の結果
 * @param stagingArea 仮置き場
 * @param selectedPatternId 選択中のパターンID
 * @param reason スナップショット理由
 * @returns 新しいスナップショット
 */
export function createSnapshot(
  editableResult: EditableResult,
  stagingArea: StagingArea,
  selectedPatternId: string | undefined,
  reason: HistorySnapshotReason
): HistorySnapshot {
  return {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    editableResult: deepCopy(editableResult),
    stagingArea: {
      products: deepCopy(stagingArea.products),
      sourcePatternIds: new Map(stagingArea.sourcePatternIds),
    },
    selectedPatternId,
    timestamp: new Date(),
    reason,
  }
}

/**
 * 履歴にスナップショットを追加
 * - 現在位置より後ろのredo履歴を削除
 * - 履歴上限を管理
 * @param state 現在の履歴状態
 * @param snapshot 追加するスナップショット
 * @returns 更新された履歴状態
 */
export function pushHistory(state: HistoryState, snapshot: HistorySnapshot): HistoryState {
  // 現在位置より後ろの履歴を削除（redo履歴をクリア）
  const newStack = state.stack.slice(0, state.currentIndex + 1)
  newStack.push(snapshot)

  // 履歴上限チェック
  if (newStack.length > state.maxSize) {
    newStack.shift()
    return {
      ...state,
      stack: newStack,
      currentIndex: newStack.length - 1,
    }
  }

  return {
    ...state,
    stack: newStack,
    currentIndex: newStack.length - 1,
  }
}

/**
 * Undo実行
 * @param state 現在の履歴状態
 * @returns 更新された履歴状態（undo不可の場合はnull）
 */
export function undo(state: HistoryState): HistoryState | null {
  if (!canUndo(state)) {
    return null
  }

  return {
    ...state,
    currentIndex: state.currentIndex - 1,
  }
}

/**
 * Redo実行
 * @param state 現在の履歴状態
 * @returns 更新された履歴状態（redo不可の場合はnull）
 */
export function redo(state: HistoryState): HistoryState | null {
  if (!canRedo(state)) {
    return null
  }

  return {
    ...state,
    currentIndex: state.currentIndex + 1,
  }
}

/**
 * Undoが可能かチェック
 * @param state 現在の履歴状態
 * @returns true: undo可能、false: undo不可
 */
export function canUndo(state: HistoryState): boolean {
  return state.currentIndex > 0
}

/**
 * Redoが可能かチェック
 * @param state 現在の履歴状態
 * @returns true: redo可能、false: redo不可
 */
export function canRedo(state: HistoryState): boolean {
  return state.currentIndex < state.stack.length - 1
}

/**
 * 現在のスナップショットを取得
 * @param state 現在の履歴状態
 * @returns 現在のスナップショット（存在しない場合はnull）
 */
export function getCurrentSnapshot(state: HistoryState): HistorySnapshot | null {
  if (state.currentIndex < 0 || state.currentIndex >= state.stack.length) {
    return null
  }
  return state.stack[state.currentIndex]
}

/**
 * 履歴をクリア
 * @returns 空の履歴状態
 */
export function clearHistory(): HistoryState {
  return {
    stack: [],
    currentIndex: -1,
    maxSize: 20,
  }
}

/**
 * 初期履歴を作成
 * @param editableResult 編集中の結果
 * @param stagingArea 仮置き場
 * @param selectedPatternId 選択中のパターンID
 * @returns 初期履歴状態
 */
export function initializeHistory(
  editableResult: EditableResult,
  stagingArea: StagingArea,
  selectedPatternId: string | undefined
): HistoryState {
  const initialSnapshot = createSnapshot(editableResult, stagingArea, selectedPatternId, 'initial')

  return {
    stack: [initialSnapshot],
    currentIndex: 0,
    maxSize: 20,
  }
}
