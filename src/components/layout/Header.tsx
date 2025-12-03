export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              取り数最適化システム v1.0
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              元板から製品を効率的に切り出す配置計算アプリ
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="text-xs text-gray-500">Nomura Gosei</p>
          </div>
        </div>
      </div>
    </header>
  )
}
