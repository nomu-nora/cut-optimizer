'use client'

import { useState } from 'react'
import { Header, MainLayout } from '@/components/layout'
import {
  PlateConfigForm,
  CutConfigForm,
  ProductList,
  ProductForm,
  PresetManager,
  OptimizationGoalForm,
} from '@/components/forms'
import { ResultSummary, PatternGroupList, PlacementDiagram, SkippedItemsDisplay } from '@/components/results'
import { PrintButton, PrintPreview } from '@/components/print'
import { Button, Card, Spinner, ErrorMessage, LoadingOverlay } from '@/components/ui'
import { calculate, type OptimizationGoal } from '@/lib/algorithm/guillotine'
import type { PlateConfig, CutConfig, Item, CalculationResult, PatternGroup } from '@/types'
import { DEFAULT_PLATE_CONFIG } from '@/types'

const DEFAULT_CUT_CONFIG: CutConfig = {
  cutWidth: 4,
  margin: 20,
}

export default function Home() {
  // Configuration state
  const [plateConfig, setPlateConfig] = useState<PlateConfig>(DEFAULT_PLATE_CONFIG)
  const [cutConfig, setCutConfig] = useState<CutConfig>(DEFAULT_CUT_CONFIG)
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('yield')
  const [useGA, setUseGA] = useState(false)
  const [useGridGrouping, setUseGridGrouping] = useState(false)

  // Items state
  const [items, setItems] = useState<Item[]>([])
  const [editingItem, setEditingItem] = useState<Item | undefined>()

  // Calculation state
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<PatternGroup | undefined>()
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Print state
  const [showPrintPreview, setShowPrintPreview] = useState(false)

  // Handlers
  const handleAddItem = (item: Item) => {
    if (editingItem) {
      // Update existing item
      setItems(items.map((i) => (i.id === item.id ? item : i)))
      setEditingItem(undefined)
    } else {
      // Add new item
      setItems([...items, item])
    }
  }

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
  }

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId))
    if (editingItem?.id === itemId) {
      setEditingItem(undefined)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(undefined)
  }

  const handleLoadPreset = (presetItems: Item[]) => {
    setItems(presetItems)
    setEditingItem(undefined)
    setResult(null)
    setSelectedPattern(undefined)
  }

  const handleCalculate = () => {
    if (items.length === 0) {
      setError('製品を追加してください')
      return
    }

    setIsCalculating(true)
    setError(null)

    // Run calculation in a setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const calculationResult = calculate(
          plateConfig,
          cutConfig,
          items,
          'maximal-rectangles',
          optimizationGoal,
          useGA,
          useGridGrouping
        )
        setResult(calculationResult)
        setSelectedPattern(calculationResult.patterns[0])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : '計算中にエラーが発生しました')
        setResult(null)
      } finally {
        setIsCalculating(false)
      }
    }, 100)
  }

  const handleClearAll = () => {
    if (confirm('すべてのデータをクリアしますか？')) {
      setItems([])
      setResult(null)
      setSelectedPattern(undefined)
      setEditingItem(undefined)
      setError(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <MainLayout
        inputArea={
          <div className="space-y-4">
            {/* Configuration Forms */}
            <PlateConfigForm
              initialConfig={plateConfig}
              onChange={setPlateConfig}
            />

            <CutConfigForm
              initialConfig={cutConfig}
              onChange={setCutConfig}
            />

            {/* Optimization Goal */}
            <OptimizationGoalForm
              value={optimizationGoal}
              onChange={setOptimizationGoal}
              useGA={useGA}
              onUseGAChange={setUseGA}
              useGridGrouping={useGridGrouping}
              onUseGridGroupingChange={setUseGridGrouping}
            />

            {/* Preset Manager */}
            <PresetManager onLoadPreset={handleLoadPreset} />

            {/* Product Form */}
            <ProductForm
              editItem={editingItem}
              onSubmit={handleAddItem}
              onCancel={editingItem ? handleCancelEdit : undefined}
            />

            {/* Product List */}
            <ProductList
              items={items}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleCalculate}
                disabled={items.length === 0 || isCalculating}
                fullWidth
                variant="primary"
              >
                {isCalculating ? '計算中...' : '計算実行'}
              </Button>
              <Button
                onClick={handleClearAll}
                disabled={items.length === 0 && !result}
                variant="outline"
              >
                クリア
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => setError(null)}
              />
            )}
          </div>
        }
        resultArea={
          <div className="space-y-4">
            {!result && !isCalculating && (
              <Card>
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    製品を追加して「計算実行」ボタンをクリックしてください
                  </p>
                </div>
              </Card>
            )}

            {isCalculating && (
              <Card>
                <div className="py-12">
                  <Spinner size="lg" text="計算中..." />
                </div>
              </Card>
            )}

            {result && (
              <>
                {/* Skipped Items Warning */}
                {result.skippedItems && result.skippedItems.length > 0 && (
                  <SkippedItemsDisplay skippedItems={result.skippedItems} />
                )}

                {/* Result Summary */}
                <ResultSummary
                  totalPlates={result.totalPlates}
                  averageYield={result.averageYield}
                  totalCost={result.totalCost}
                />

                {/* Print Button */}
                <div className="flex justify-end">
                  <PrintButton onPrint={() => setShowPrintPreview(true)} />
                </div>

                {/* Pattern List */}
                <PatternGroupList
                  patterns={result.patterns}
                  selectedPatternId={selectedPattern?.patternId}
                  onSelectPattern={setSelectedPattern}
                />

                {/* Placement Diagram */}
                {selectedPattern && (
                  <PlacementDiagram
                    pattern={selectedPattern}
                    plateConfig={plateConfig}
                    cutConfig={cutConfig}
                  />
                )}
              </>
            )}
          </div>
        }
      />

      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isCalculating} text="計算中..." />

      {/* Print Preview */}
      {showPrintPreview && result && (
        <PrintPreview
          result={result}
          plateConfig={plateConfig}
          cutConfig={cutConfig}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </main>
  )
}
