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
import {
  ResultSummary,
  PatternGroupList,
  PlacementDiagram,
  EditablePlacementDiagram,
  SkippedItemsDisplay,
} from '@/components/results'
import { EditModeToolbar, StagingAreaComponent, SplitPatternDialog } from '@/components/editing'
import { PrintButton, PrintPreview } from '@/components/print'
import { Button, Spinner, ErrorMessage, LoadingOverlay, Card } from '@/components/ui'
import { calculate, calculateWithOffcuts, type OptimizationGoal } from '@/lib/algorithm/guillotine'
import { calculateYield } from '@/lib/utils/yield-calculator'
import { validateQuantities } from '@/lib/validation/quantity-validation'
import { isValidPlacement } from '@/lib/validation/placement-validation'
import type {
  PlateConfig,
  CutConfig,
  Item,
  OffcutPlate,
  CalculationResult,
  PatternGroup,
  OffcutMode,
  EditableResult,
  StagingArea,
  Placement,
} from '@/types'
import { DEFAULT_PLATE_CONFIG } from '@/types'

const DEFAULT_CUT_CONFIG: CutConfig = {
  cutWidth: 4,
  margin: 20,
}

export default function Home() {
  // Configuration state
  const [plateConfig, setPlateConfig] = useState<PlateConfig>(DEFAULT_PLATE_CONFIG)
  const [cutConfig, setCutConfig] = useState<CutConfig>(DEFAULT_CUT_CONFIG)
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('remaining-space')
  const [useGA, setUseGA] = useState(false)
  const [useGridGrouping, setUseGridGrouping] = useState(true)
  const [offcutMode, setOffcutMode] = useState<OffcutMode>('consumption')

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

  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [editableResult, setEditableResult] = useState<EditableResult | null>(null)
  const [stagingArea, setStagingArea] = useState<StagingArea>({
    products: [],
    sourcePatternIds: new Map(),
  })
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showSplitDialog, setShowSplitDialog] = useState(false)

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
        const calculationResult =
          offcuts.length > 0
            ? calculateWithOffcuts(
                plateConfig,
                cutConfig,
                items,
                offcuts,
                optimizationGoal,
                offcutMode
              )
            : calculate(plateConfig, cutConfig, items, optimizationGoal, useGA, useGridGrouping)
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

  // Edit mode handlers
  const handleEnterEditMode = () => {
    if (!result || !selectedPattern) {
      console.log('handleEnterEditMode: missing result or selectedPattern', {
        result: !!result,
        selectedPattern,
      })
      return
    }

    console.log('handleEnterEditMode: entering edit mode')
    startEditMode()
  }

  const startEditMode = () => {
    if (!result) return

    console.log('=== startEditMode ===')
    console.log('Original result.patterns:', result.patterns)
    console.log('Total patterns:', result.patterns.length)
    result.patterns.forEach((pattern) => {
      console.log(
        `Pattern ${pattern.patternId}: ${pattern.placements.length} placements, count=${pattern.count}`
      )
    })

    // Deep copy the result for editing (Copy-on-Write pattern)
    const editableCopy: EditableResult = {
      ...result,
      patterns: result.patterns.map((pattern) => ({
        ...pattern,
        // Deep copy offcutInfo to avoid shared references
        offcutInfo: pattern.offcutInfo
          ? {
              ...pattern.offcutInfo,
            }
          : undefined,
        placements: pattern.placements.map((placement) => ({
          ...placement,
          item: { ...placement.item },
        })),
      })),
      isEdited: false,
      originalResult: result,
      modifications: [],
    }

    console.log('Created editableCopy.patterns:', editableCopy.patterns)
    console.log('Total patterns in copy:', editableCopy.patterns.length)
    editableCopy.patterns.forEach((pattern) => {
      console.log(
        `Copy Pattern ${pattern.patternId}: ${pattern.placements.length} placements, count=${pattern.count}`
      )
    })

    setEditableResult(editableCopy)
    setEditMode(true)
    setStagingArea({ products: [], sourcePatternIds: new Map() })
    setSelectedPlacement(null)
  }

  const handleSplitPatternClick = () => {
    if (!selectedPattern || selectedPattern.count <= 1) {
      console.log('Cannot split: pattern count is 1 or less')
      return
    }
    console.log('Opening split pattern dialog for pattern:', selectedPattern.patternId)
    setShowSplitDialog(true)
  }

  const handleSplitPattern = (splitCount: number) => {
    if (!editableResult || !selectedPattern) return

    console.log(`=== handleSplitPattern: Splitting pattern ${selectedPattern.patternId} ===`)
    console.log(
      `Split count: ${splitCount}, Parent remaining: ${selectedPattern.count - splitCount}`
    )

    // Generate child pattern ID
    // Count existing children with same parent ID
    const parentId = selectedPattern.patternId
    const existingChildren = editableResult.patterns.filter((p) =>
      p.patternId.startsWith(`${parentId}-`)
    )
    const childNumber = existingChildren.length + 1
    const childPatternId = `${parentId}-${childNumber}`

    console.log(`Generated child pattern ID: ${childPatternId}`)

    // Update parent pattern count
    const updatedParent: PatternGroup = {
      ...selectedPattern,
      count: selectedPattern.count - splitCount,
    }

    // Create child pattern (copy placements from parent)
    const childPattern: PatternGroup = {
      ...selectedPattern,
      patternId: childPatternId,
      count: splitCount,
      placements: selectedPattern.placements.map((placement) => ({
        ...placement,
        item: { ...placement.item },
      })),
    }

    console.log('Updated parent pattern:', updatedParent)
    console.log('Created child pattern:', childPattern)

    // Update patterns array - insert child right after parent
    const parentIndex = editableResult.patterns.findIndex(
      (p) => p.patternId === selectedPattern.patternId
    )
    const updatedPatterns = editableResult.patterns.map((p) =>
      p.patternId === selectedPattern.patternId ? updatedParent : p
    )
    // Insert child pattern right after parent
    updatedPatterns.splice(parentIndex + 1, 0, childPattern)

    console.log('Updated patterns array:', updatedPatterns)
    console.log(`Child pattern inserted at index ${parentIndex + 1} (right after parent)`)

    // Recalculate averageYield
    const totalYield = updatedPatterns.reduce((sum, p) => sum + p.yield * p.count, 0)
    const totalCount = updatedPatterns.reduce((sum, p) => sum + p.count, 0)
    const averageYield = totalCount > 0 ? totalYield / totalCount : 0

    console.log('Recalculated average yield:', averageYield)

    // Update editable result
    const updatedEditableResult: EditableResult = {
      ...editableResult,
      patterns: updatedPatterns,
      averageYield,
      isEdited: true,
    }

    setEditableResult(updatedEditableResult)
    setSelectedPattern(childPattern) // Select the newly created child pattern
    setShowSplitDialog(false)

    console.log('Pattern split completed')
  }

  const handleApplyEdit = () => {
    if (!editableResult || !selectedPattern) return

    console.log('=== handleApplyEdit ===')
    console.log('editableResult:', editableResult)
    console.log('editableResult.patterns:', editableResult.patterns)
    console.log('stagingArea:', stagingArea)
    console.log('items:', items)

    // Validate quantities
    const validation = validateQuantities(editableResult, stagingArea, items)
    console.log('Validation result:', validation)
    if (!validation.valid) {
      const errorMessage = '数量が一致していません:\n' + validation.errors.join('\n')
      alert(errorMessage)
      return
    }

    // Apply edits
    setResult(editableResult)

    // Reset edit mode and pattern selection
    setEditMode(false)
    setEditableResult(null)
    setStagingArea({ products: [], sourcePatternIds: new Map() })
    setSelectedPlacement(null)

    // Reset selectedPattern to avoid pointing to deleted patterns
    // Select the first pattern from the updated result if available
    if (editableResult.patterns && editableResult.patterns.length > 0) {
      setSelectedPattern(editableResult.patterns[0])
    } else {
      setSelectedPattern(undefined)
    }
  }

  const handleDiscardEdit = () => {
    if (!confirm('編集内容をすべて破棄しますか？')) return

    // Discard edits and return to view mode
    setEditMode(false)
    setEditableResult(null)
    setStagingArea({ products: [], sourcePatternIds: new Map() })
    setSelectedPlacement(null)

    // Reset selectedPattern to the original result's first pattern
    if (result && result.patterns && result.patterns.length > 0) {
      setSelectedPattern(result.patterns[0])
    } else {
      setSelectedPattern(undefined)
    }
  }

  const handleToggleSnap = () => {
    setSnapEnabled(!snapEnabled)
  }

  const handlePlacementUpdate = (updatedPlacements: Placement[]) => {
    if (!editableResult || !selectedPattern) return

    // Update the placements for the selected pattern
    const updatedPatterns = editableResult.patterns.map((pattern) => {
      if (pattern.patternId === selectedPattern.patternId) {
        // Recalculate yield with new placements
        const plateWidth =
          pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.width : plateConfig.width
        const plateHeight =
          pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.height : plateConfig.height
        const newYield = calculateYield(updatedPlacements, plateWidth, plateHeight)

        return {
          ...pattern,
          placements: updatedPlacements,
          yield: newYield,
        }
      }
      return pattern
    })

    // Recalculate averageYield
    const totalYield = updatedPatterns.reduce((sum, p) => sum + p.yield * p.count, 0)
    const totalCount = updatedPatterns.reduce((sum, p) => sum + p.count, 0)
    const averageYield = totalCount > 0 ? totalYield / totalCount : 0

    // Update editableResult with new patterns
    setEditableResult({
      ...editableResult,
      patterns: updatedPatterns,
      averageYield,
      isEdited: true,
    })

    // Update selectedPattern to reflect changes
    const updatedSelectedPattern = updatedPatterns.find(
      (p) => p.patternId === selectedPattern.patternId
    )
    if (updatedSelectedPattern) {
      setSelectedPattern(updatedSelectedPattern)
    }
  }

  const handlePlacementClick = (placement: Placement) => {
    if (!editableResult || !selectedPattern) return

    console.log('Placement clicked:', placement.item.name, 'Pattern count:', selectedPattern.count)

    // パターンのcount分の製品を仮置き場に追加
    const newStagingProducts = [...stagingArea.products]
    const newSourcePatternIds = new Map(stagingArea.sourcePatternIds)

    for (let i = 0; i < selectedPattern.count; i++) {
      // Generate unique ID for this placement in staging area
      const uniqueId = `${placement.item.id}-${Date.now()}-${Math.random()}`
      const placementWithUniqueId = {
        ...placement,
        item: {
          ...placement.item,
          id: uniqueId,
        },
      }

      newStagingProducts.push(placementWithUniqueId)
      newSourcePatternIds.set(uniqueId, selectedPattern.patternId)
    }

    console.log(`Added ${selectedPattern.count} items to staging area`)

    setStagingArea({
      products: newStagingProducts,
      sourcePatternIds: newSourcePatternIds,
    })

    // Remove placement from current pattern (find exact placement, not just by item.id)
    const placementIndex = selectedPattern.placements.findIndex(
      (p) => p.x === placement.x && p.y === placement.y && p.item.id === placement.item.id
    )
    if (placementIndex !== -1) {
      const updatedPlacements = [
        ...selectedPattern.placements.slice(0, placementIndex),
        ...selectedPattern.placements.slice(placementIndex + 1),
      ]
      handlePlacementUpdate(updatedPlacements)
    }
  }

  const handleBackgroundClick = (x: number, y: number) => {
    if (!editableResult || !selectedPattern || !selectedPlacement) return

    // Extract base item ID (UUID portion)
    const getBaseItemId = (itemId: string): string => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      const match = itemId.match(uuidPattern)
      return match ? match[0] : itemId
    }

    const baseItemId = getBaseItemId(selectedPlacement.item.id)

    // Count available items in staging area with matching base ID
    const availableCount = stagingArea.products.filter((p) => {
      const pBaseId = getBaseItemId(p.item.id)
      return pBaseId === baseItemId
    }).length

    console.log(
      `Placing item: ${selectedPlacement.item.name}, Required: ${selectedPattern.count}, Available: ${availableCount}`
    )

    // Check if we have enough items in staging area
    if (availableCount < selectedPattern.count) {
      alert(
        `配置に必要な数量が不足しています。\n\n` +
          `製品名: ${selectedPlacement.item.name}\n` +
          `必要数: ${selectedPattern.count}個\n` +
          `仮置き場の在庫: ${availableCount}個\n\n` +
          `パターンは${selectedPattern.count}枚使用されるため、${selectedPattern.count}個必要です。`
      )
      return
    }

    // Create new placement at clicked position
    const newPlacement: Placement = {
      ...selectedPlacement,
      x,
      y,
    }

    // Allow placement even if invalid (will be shown in red)
    // Add to current pattern
    const updatedPlacements = [...selectedPattern.placements, newPlacement]
    handlePlacementUpdate(updatedPlacements)

    // Remove count items from staging area (matching base ID)
    let removedCount = 0
    const newStagingProducts = stagingArea.products.filter((p) => {
      const pBaseId = getBaseItemId(p.item.id)
      if (pBaseId === baseItemId && removedCount < selectedPattern.count) {
        removedCount++
        return false // Remove this item
      }
      return true // Keep this item
    })

    console.log(`Removed ${removedCount} items from staging area`)

    setStagingArea({
      products: newStagingProducts,
      sourcePatternIds: stagingArea.sourcePatternIds,
    })

    // Clear selection
    setSelectedPlacement(null)
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
                  <PlateConfigForm initialConfig={plateConfig} onChange={setPlateConfig} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">カット設定</h3>
                  <CutConfigForm initialConfig={cutConfig} onChange={setCutConfig} />
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

            <OffcutList offcuts={offcuts} onEdit={handleEditOffcut} onDelete={handleDeleteOffcut} />

            {/* Product Section */}
            <PresetManager onLoadPreset={handleLoadPreset} />

            <ProductForm
              editItem={editingItem}
              onSubmit={handleAddItem}
              onCancel={editingItem ? handleCancelEdit : undefined}
            />

            <ProductList items={items} onEdit={handleEditItem} onDelete={handleDeleteItem} />

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
              offcutMode={offcutMode}
              onOffcutModeChange={setOffcutMode}
              hasOffcuts={offcuts.length > 0}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
              disabled={items.length === 0}
            />

            {/* Error Display */}
            {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

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
                  result={editMode && editableResult ? editableResult : result}
                  registeredOffcutCount={offcuts.reduce((sum, o) => sum + o.quantity, 0)}
                  totalItemQuantity={items.reduce((sum, i) => sum + i.quantity, 0)}
                />

                {/* Edit Mode Toolbar */}
                <EditModeToolbar
                  editMode={editMode}
                  snapEnabled={snapEnabled}
                  hasResult={result !== null}
                  selectedPattern={
                    selectedPattern
                      ? { patternId: selectedPattern.patternId, count: selectedPattern.count }
                      : null
                  }
                  onEnterEditMode={handleEnterEditMode}
                  onApply={handleApplyEdit}
                  onDiscard={handleDiscardEdit}
                  onToggleSnap={handleToggleSnap}
                  onSplitPattern={handleSplitPatternClick}
                />

                {/* Print Button */}
                {!editMode && (
                  <div className="flex justify-end">
                    <PrintButton onPrint={() => setShowPrintPreview(true)} />
                  </div>
                )}

                {/* Pattern List */}
                <PatternGroupList
                  patterns={editMode && editableResult ? editableResult.patterns : result.patterns}
                  selectedPatternId={selectedPattern?.patternId}
                  onSelectPattern={setSelectedPattern}
                />

                {/* Staging Area (in edit mode) */}
                {editMode && stagingArea.products.length > 0 && (
                  <StagingAreaComponent
                    stagingArea={stagingArea}
                    selectedPlacement={selectedPlacement}
                    onSelectPlacement={setSelectedPlacement}
                  />
                )}

                {/* Placement Diagram */}
                {selectedPattern && !editMode && (
                  <PlacementDiagram
                    pattern={selectedPattern}
                    plateConfig={plateConfig}
                    cutConfig={cutConfig}
                  />
                )}

                {/* Editable Placement Diagram (in edit mode) */}
                {selectedPattern && editMode && editableResult && (
                  <EditablePlacementDiagram
                    pattern={selectedPattern}
                    plateConfig={plateConfig}
                    cutConfig={cutConfig}
                    snapEnabled={snapEnabled}
                    selectedPlacement={selectedPlacement}
                    onPlacementUpdate={handlePlacementUpdate}
                    onPlacementClick={handlePlacementClick}
                    onBackgroundClick={handleBackgroundClick}
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
          items={items}
          offcuts={offcuts}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Split Pattern Dialog */}
      {showSplitDialog && selectedPattern && (
        <SplitPatternDialog
          pattern={selectedPattern}
          onSplit={handleSplitPattern}
          onClose={() => setShowSplitDialog(false)}
        />
      )}
    </main>
  )
}
