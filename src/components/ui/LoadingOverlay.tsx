import { Spinner } from './Spinner'

export interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
}

export function LoadingOverlay({ isLoading, text = '処理中...' }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="読み込み中"
    >
      <div className="bg-white rounded-lg shadow-xl p-6">
        <Spinner size="lg" text={text} />
      </div>
    </div>
  )
}
