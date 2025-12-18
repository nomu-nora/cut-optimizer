import { Button } from '@/components/ui'

interface EditModeToolbarProps {
  /** 編集モード中かどうか */
  editMode: boolean
  /** スナップが有効かどうか */
  snapEnabled: boolean
  /** 計算結果が存在するかどうか */
  hasResult: boolean
  /** 選択中のパターン */
  selectedPattern: { patternId: string; count: number } | null
  /** Undoが可能かどうか */
  canUndo: boolean
  /** Redoが可能かどうか */
  canRedo: boolean
  /** 編集モードに入る */
  onEnterEditMode: () => void
  /** 編集内容を適用 */
  onApply: () => void
  /** 編集内容を破棄 */
  onDiscard: () => void
  /** Undo実行 */
  onUndo: () => void
  /** Redo実行 */
  onRedo: () => void
  /** スナップON/OFF切り替え */
  onToggleSnap: () => void
  /** パターン分割ボタンクリック */
  onSplitPattern: () => void
}

/**
 * 編集モードツールバー
 * 編集モードの切り替え、適用、破棄、スナップ設定を提供
 */
export function EditModeToolbar({
  editMode,
  snapEnabled,
  hasResult,
  selectedPattern,
  canUndo,
  canRedo,
  onEnterEditMode,
  onApply,
  onDiscard,
  onUndo,
  onRedo,
  onToggleSnap,
  onSplitPattern,
}: EditModeToolbarProps) {
  if (!editMode && !hasResult) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {!editMode ? (
          // ビューモード: 編集モードボタンのみ表示
          <Button onClick={onEnterEditMode} variant="primary" size="md">
            編集モード
          </Button>
        ) : (
          // 編集モード: 適用、破棄、Undo/Redo、スナップ切り替えを表示
          <>
            <div className="flex items-center gap-2">
              <Button onClick={onApply} variant="primary" size="md">
                ✓ 適用
              </Button>
              <Button onClick={onDiscard} variant="secondary" size="md">
                ✕ すべて破棄
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors
                  ${
                    canUndo
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
                title="元に戻す (Ctrl+Z / Cmd+Z)"
              >
                <span className="text-base">↶</span>
                <span className="hidden sm:inline">元に戻す</span>
              </button>

              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors
                  ${
                    canRedo
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
                title="やり直す (Ctrl+Shift+Z / Cmd+Shift+Z)"
              >
                <span className="text-base">↷</span>
                <span className="hidden sm:inline">やり直す</span>
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            <button
              type="button"
              onClick={onToggleSnap}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors
                ${
                  snapEnabled
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              aria-pressed={snapEnabled}
            >
              <span className="text-base">{snapEnabled ? '🧲' : '📍'}</span>
              <span>スナップ: {snapEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onSplitPattern}
              disabled={!selectedPattern || selectedPattern.count <= 1}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors
                ${
                  selectedPattern && selectedPattern.count > 1
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
              title={
                !selectedPattern
                  ? 'パターンを選択してください'
                  : selectedPattern.count <= 1
                    ? 'このパターンは分割できません（1枚のみ）'
                    : 'パターンを分割'
              }
            >
              <span className="text-base">✂️</span>
              <span>分割</span>
            </button>

            <div className="flex-1" />

            <div className="text-sm text-gray-600">
              <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                編集モード中
              </span>
            </div>
          </>
        )}
      </div>

      {editMode && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
          <p>
            💡 <strong>操作方法:</strong> 製品をドラッグして移動、クリックで仮置き場へ移動
          </p>
        </div>
      )}
    </div>
  )
}
