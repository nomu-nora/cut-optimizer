'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { ResultSummary } from '@/components/results/ResultSummary'
import { PatternGroupList } from '@/components/results/PatternGroupList'
import { PlacementDiagram } from '@/components/results/PlacementDiagram'
import type { CalculationResult, PlateConfig, CutConfig } from '@/types'

export interface PrintPreviewProps {
  result: CalculationResult
  plateConfig: PlateConfig
  cutConfig: CutConfig
  onClose: () => void
}

export function PrintPreview({
  result,
  plateConfig,
  cutConfig,
  onClose,
}: PrintPreviewProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gray-100">
      {/* Header with controls */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-300 shadow-sm no-print">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">印刷プレビュー</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} disabled={isPrinting}>
              <svg
                className="w-5 h-5 mr-2 inline-block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              印刷
            </Button>
            <Button variant="outline" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </div>

      {/* Print content */}
      <div className="print-preview-mode container mx-auto px-4 py-8 space-y-6">
        {/* Page 1: Summary and Pattern List */}
        <div className="print-summary bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            取り数最適化 計算結果
          </h1>

          <div className="mb-6">
            <ResultSummary
              totalPlates={result.totalPlates}
              averageYield={result.averageYield}
              totalCost={result.totalCost}
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">元板設定</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">幅</p>
                <p className="font-medium">{plateConfig.width} mm</p>
              </div>
              <div>
                <p className="text-gray-600">高さ</p>
                <p className="font-medium">{plateConfig.height} mm</p>
              </div>
              <div>
                <p className="text-gray-600">単価</p>
                <p className="font-medium">¥{plateConfig.unitPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-900">カット設定</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">カット幅</p>
                <p className="font-medium">{cutConfig.cutWidth} mm</p>
              </div>
              <div>
                <p className="text-gray-600">余白</p>
                <p className="font-medium">{cutConfig.margin} mm</p>
              </div>
            </div>
          </div>

          <div className="print-pattern-list">
            <PatternGroupList patterns={result.patterns} />
          </div>
        </div>

        {/* Pages 2+: Each pattern's diagram on a separate page */}
        {result.patterns.map((pattern) => (
          <div key={pattern.patternId} className="print-pattern-diagram bg-white p-6 rounded-lg shadow-sm">
            <PlacementDiagram
              pattern={pattern}
              plateConfig={plateConfig}
              cutConfig={cutConfig}
            />
          </div>
        ))}

        {/* Print footer */}
        <div className="print-footer text-center py-4 text-sm text-gray-500">
          取り数最適化システム v1.0 - Nomura Gosei
        </div>
      </div>
    </div>
  )
}
