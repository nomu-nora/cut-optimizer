import { ReactNode } from 'react'

interface MainLayoutProps {
  inputArea: ReactNode
  resultArea: ReactNode
}

export function MainLayout({ inputArea, resultArea }: MainLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 入力エリア */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          {inputArea}
        </div>

        {/* 結果表示エリア */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
          {resultArea}
        </div>
      </div>
    </div>
  )
}
