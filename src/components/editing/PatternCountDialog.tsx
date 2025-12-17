import { Card, Button } from '@/components/ui'

export interface PatternCountDialogProps {
  patternId: string
  count: number
  onSelect: (mode: 'single' | 'all') => void
  onCancel: () => void
}

/**
 * パターン数が2以上の場合に表示するダイアログ
 * 編集内容を1枚のみに適用するか、全枚数に適用するかを選択
 */
export function PatternCountDialog({
  patternId,
  count,
  onSelect,
  onCancel,
}: PatternCountDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <Card title={`パターン${patternId}の編集範囲`}>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                このパターンは<span className="font-bold text-lg">{count}枚</span>使用されています
              </p>
            </div>

            <p className="text-sm text-gray-700">編集内容を適用する範囲を選択してください：</p>

            <div className="space-y-3">
              <button
                onClick={() => onSelect('single')}
                className="w-full text-left p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900 mb-1">
                  この1枚のみ（新パターン作成）
                </div>
                <div className="text-sm text-gray-600">
                  編集内容を反映した新しいパターンを作成します。
                  <br />
                  元のパターンは{count - 1}枚として残ります。
                </div>
              </button>

              <button
                onClick={() => onSelect('all')}
                className="w-full text-left p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900 mb-1">全{count}枚に適用</div>
                <div className="text-sm text-gray-600">
                  このパターンの全{count}枚に編集内容を適用します。
                </div>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onCancel} className="w-full">
                キャンセル
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
