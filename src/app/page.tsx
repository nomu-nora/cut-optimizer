'use client'

import { useState } from 'react'
import { Header, MainLayout } from '@/components/layout'
import {
  PlateConfigForm,
  CutConfigForm,
  ProductList,
  ProductForm,
  PresetManager,
  CalculationControl,
  OffcutForm,
  OffcutList,
  OffcutPresetManager,
} from '@/components/forms'
import { ResultSummary, PatternGroupList, PlacementDiagram, SkippedItemsDisplay } from '@/components/results'
import { PrintButton, PrintPreview } from '@/components/print'
import { Button, Spinner, ErrorMessage, LoadingOverlay, Card } from '@/components/ui'
import { calculate, calculateWithOffcuts, type OptimizationGoal } from '@/lib/algorithm/guillotine'
import type { PlateConfig, CutConfig, Item, OffcutPlate, CalculationResult, PatternGroup } from '@/types'
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

  // Offcuts state
  const [offcuts, setOffcuts] = useState<OffcutPlate[]>([])
  const [editingOffcut, setEditingOffcut] = useState<OffcutPlate | undefined>()

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

  const handleAddOffcut = (offcut: OffcutPlate) => {
    if (editingOffcut) {
      // Update existing offcut
      setOffcuts(offcuts.map((o) => (o.id === offcut.id ? offcut : o)))
      setEditingOffcut(undefined)
    } else {
      // Add new offcut
      setOffcuts([...offcuts, offcut])
    }
  }

  const handleEditOffcut = (offcut: OffcutPlate) => {
    setEditingOffcut(offcut)
  }

  const handleDeleteOffcut = (offcutId: string) => {
    setOffcuts(offcuts.filter((o) => o.id !== offcutId))
    if (editingOffcut?.id === offcutId) {
      setEditingOffcut(undefined)
    }
  }

  const handleCancelEditOffcut = () => {
    setEditingOffcut(undefined)
  }

  const handleLoadOffcutPreset = (presetOffcuts: OffcutPlate[]) => {
    setOffcuts(presetOffcuts)
    setEditingOffcut(undefined)
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
        // Use offcuts if available
        const calculationResult = offcuts.length > 0
          ? calculateWithOffcuts(
              plateConfig,
              cutConfig,
              items,
              offcuts,
              optimizationGoal
            )
          : calculate(
              plateConfig,
              cutConfig,
              items,
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
      setOffcuts([])
      setResult(null)
      setSelectedPattern(undefined)
      setEditingItem(undefined)
      setEditingOffcut(undefined)
      setError(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <MainLayout
        inputArea={
          <div className="space-y-4">
            {/* Configuration Forms - Combined */}
            <Card title="元板・カット設定">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">元板設定</h3>
                  <PlateConfigForm
                    initialConfig={plateConfig}
                    onChange={setPlateConfig}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">カット設定</h3>
                  <CutConfigForm
                    initialConfig={cutConfig}
                    onChange={setCutConfig}
                  />
                </div>
              </div>
            </Card>

            {/* Offcut Section */}
            <OffcutPresetManager onLoadPreset={handleLoadOffcutPreset} />

            <OffcutForm
              editItem={editingOffcut}
              onSubmit={handleAddOffcut}
              onCancel={editingOffcut ? handleCancelEditOffcut : undefined}
            />

            <OffcutList
              offcuts={offcuts}
              onEdit={handleEditOffcut}
              onDelete={handleDeleteOffcut}
            />

            {/* Product Section */}
            <PresetManager onLoadPreset={handleLoadPreset} />

            <ProductForm
              editItem={editingItem}
              onSubmit={handleAddItem}
              onCancel={editingItem ? handleCancelEdit : undefined}
            />

            <ProductList
              items={items}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />

            {/* Clear Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleClearAll}
                disabled={items.length === 0 && offcuts.length === 0 && !result}
                variant="outline"
              >
                すべてクリア
              </Button>
            </div>
          </div>
        }
        resultArea={
          <div className="space-y-4">
            {/* Calculation Control */}
            <CalculationControl
              optimizationGoal={optimizationGoal}
              onOptimizationGoalChange={setOptimizationGoal}
              useGA={useGA}
              onUseGAChange={setUseGA}
              useGridGrouping={useGridGrouping}
              onUseGridGroupingChange={setUseGridGrouping}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
              disabled={items.length === 0}
            />

            {/* Error Display */}
            {error && (
              <ErrorMessage
                message={error}
                onRetry={() => setError(null)}
              />
            )}

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
                  result={result}
                  registeredOffcutCount={offcuts.reduce((sum, o) => sum + o.quantity, 0)}
                  totalItemQuantity={items.reduce((sum, i) => sum + i.quantity, 0)}
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
