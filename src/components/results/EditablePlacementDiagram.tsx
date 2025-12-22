import { useRef, useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui'
import { DraggableProduct, SnapGuide } from '@/components/editing'
import {
  generateSnapPoints,
  getSnapThreshold,
  findNearestSnapPointForProduct,
} from '@/lib/editing/snap-points'
import { isValidPlacement } from '@/lib/validation/placement-validation'
import type { PatternGroup, PlateConfig, CutConfig, Placement, SnapPoint } from '@/types'

export interface EditablePlacementDiagramProps {
  pattern: PatternGroup
  plateConfig: PlateConfig
  cutConfig: CutConfig
  snapEnabled: boolean
  selectedPlacement: Placement | null
  selectedPlacements: Set<string>
  getPlacementId: (placement: Placement) => string
  onPlacementUpdate: (updatedPlacements: Placement[]) => void
  onPlacementClick: (placement: Placement) => void
  onSelectionToggle: (placementId: string, mode: 'toggle' | 'add' | 'set') => void
  onClearSelection: () => void
  onBackgroundClick: (x: number, y: number) => void
  // Navigation props
  currentIndex?: number
  totalPatterns?: number
  onPrevPattern?: () => void
  onNextPattern?: () => void
}

/**
 * 編集可能な配置図コンポーネント
 * ドラッグ&ドロップとスナップ機能を統合
 */
export function EditablePlacementDiagram({
  pattern,
  plateConfig,
  cutConfig,
  snapEnabled,
  selectedPlacement,
  selectedPlacements,
  getPlacementId,
  onPlacementUpdate,
  onPlacementClick,
  onSelectionToggle,
  onClearSelection,
  onBackgroundClick,
  currentIndex,
  totalPatterns,
  onPrevPattern,
  onNextPattern,
}: EditablePlacementDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingPlacement, setDraggingPlacement] = useState<Placement | null>(null)
  const [currentSnapPoint, setCurrentSnapPoint] = useState<SnapPoint | null>(null)
  const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null)

  // Use offcut dimensions if this is an offcut pattern
  const plateWidth =
    pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.width : plateConfig.width
  const plateHeight =
    pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.height : plateConfig.height

  // Offcuts have no margin (already cut)
  const margin = pattern.isOffcut ? 0 : cutConfig.margin

  // Create effective cut config with margin=0 for offcuts
  const effectiveCutConfig: CutConfig = pattern.isOffcut ? { ...cutConfig, margin: 0 } : cutConfig

  const SCALE = 0.4 // Scale factor to fit diagram on screen
  const viewWidth = plateWidth * SCALE
  const viewHeight = plateHeight * SCALE

  // Calculate effective area (with margins)
  const effectiveX = margin
  const effectiveY = margin
  const effectiveWidth = plateWidth - margin * 2
  const effectiveHeight = plateHeight - margin * 2

  // Generate snap points (excluding the dragging placement)
  const snapPoints = useMemo(() => {
    if (!snapEnabled) return []
    const otherPlacements = draggingPlacement
      ? pattern.placements.filter((p) => p.item.id !== draggingPlacement.item.id)
      : pattern.placements
    return generateSnapPoints(otherPlacements, effectiveCutConfig, plateWidth, plateHeight)
  }, [pattern.placements, cutConfig, snapEnabled, draggingPlacement, plateWidth, plateHeight])

  const snapThreshold = getSnapThreshold()

  // Keyboard arrow key handler for moving selected placements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPlacements.size === 0) return

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Escape to clear selection
        if (e.key === 'Escape') {
          onClearSelection()
        }
        return
      }

      e.preventDefault()

      // Movement distance: 1mm or 10mm with Shift
      const distance = e.shiftKey ? 10 : 1

      // Calculate offset based on arrow key
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft') dx = -distance
      if (e.key === 'ArrowRight') dx = distance
      if (e.key === 'ArrowUp') dy = -distance
      if (e.key === 'ArrowDown') dy = distance

      // Move all selected placements
      const updatedPlacements = pattern.placements.map((placement) => {
        const placementId = getPlacementId(placement)
        if (selectedPlacements.has(placementId)) {
          return {
            ...placement,
            x: placement.x + dx,
            y: placement.y + dy,
          }
        }
        return placement
      })

      onPlacementUpdate(updatedPlacements)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPlacements, pattern.placements, getPlacementId, onPlacementUpdate, onClearSelection])

  const handleDragStart = (placement: Placement) => {
    setDraggingPlacement(placement)
  }

  const handleDrag = (x: number, y: number) => {
    if (!draggingPlacement) return

    let finalX = x
    let finalY = y

    // Apply snapping if enabled
    if (snapEnabled && snapPoints.length > 0) {
      console.log('Snap points count:', snapPoints.length, 'Threshold:', snapThreshold)
      const otherPlacements = pattern.placements.filter(
        (p) => p.item.id !== draggingPlacement.item.id
      )
      const snapResult = findNearestSnapPointForProduct(
        x,
        y,
        draggingPlacement.width,
        draggingPlacement.height,
        snapPoints,
        snapThreshold,
        draggingPlacement,
        otherPlacements,
        cutConfig
      )
      if (snapResult) {
        console.log('Snapped to:', snapResult.snapPoint)
        finalX = snapResult.x
        finalY = snapResult.y
        setCurrentSnapPoint(snapResult.snapPoint)
      } else {
        console.log('No snap point found within threshold')
        setCurrentSnapPoint(null)
      }
    }

    setTempPosition({ x: finalX, y: finalY })
  }

  const handleDragEnd = (x: number, y: number) => {
    if (!draggingPlacement) return

    let finalX = x
    let finalY = y

    // If we have a temp position from dragging (which includes snap), use it
    if (tempPosition) {
      finalX = tempPosition.x
      finalY = tempPosition.y
    } else if (snapEnabled && snapPoints.length > 0) {
      // Otherwise apply snapping
      const otherPlacements = pattern.placements.filter(
        (p) => p.item.id !== draggingPlacement.item.id
      )
      const snapResult = findNearestSnapPointForProduct(
        x,
        y,
        draggingPlacement.width,
        draggingPlacement.height,
        snapPoints,
        snapThreshold,
        draggingPlacement,
        otherPlacements,
        cutConfig
      )
      if (snapResult) {
        finalX = snapResult.x
        finalY = snapResult.y
      }
    }

    // Create updated placement
    const updatedPlacement: Placement = {
      ...draggingPlacement,
      x: finalX,
      y: finalY,
    }

    // Always update placements (even if invalid - will be shown in red)
    const newPlacements = pattern.placements.map((p) =>
      p.item.id === draggingPlacement.item.id ? updatedPlacement : p
    )
    onPlacementUpdate(newPlacements)

    // Reset state
    setDraggingPlacement(null)
    setCurrentSnapPoint(null)
    setTempPosition(null)
  }

  const handlePlacementClick = (placement: Placement) => {
    onPlacementClick(placement)
  }

  const handleRotate = (placement: Placement) => {
    console.log('handleRotate called for placement:', placement.item.name)

    // Swap width and height
    const newWidth = placement.height
    const newHeight = placement.width

    console.log(`Rotating: ${placement.width}x${placement.height} → ${newWidth}x${newHeight}`)

    // Create rotated placement
    const rotatedPlacement: Placement = {
      ...placement,
      width: newWidth,
      height: newHeight,
      rotated: !placement.rotated,
    }

    // Check if rotation would cause out-of-bounds
    const effectivePlateConfig: PlateConfig = {
      ...plateConfig,
      width: plateWidth,
      height: plateHeight,
    }

    // If out of bounds, try to adjust position
    if (
      rotatedPlacement.x + rotatedPlacement.width > plateWidth - margin ||
      rotatedPlacement.y + rotatedPlacement.height > plateHeight - margin
    ) {
      console.log('Rotation would be out of bounds, adjusting position...')
      // Try to fit within bounds by adjusting position
      const adjustedX = Math.min(rotatedPlacement.x, plateWidth - margin - rotatedPlacement.width)
      const adjustedY = Math.min(rotatedPlacement.y, plateHeight - margin - rotatedPlacement.height)

      rotatedPlacement.x = Math.max(margin, adjustedX)
      rotatedPlacement.y = Math.max(margin, adjustedY)
      console.log(
        `Position adjusted: (${placement.x}, ${placement.y}) → (${rotatedPlacement.x}, ${rotatedPlacement.y})`
      )
    }

    // Update placements
    const newPlacements = pattern.placements.map((p) =>
      p.item.id === placement.item.id ? rotatedPlacement : p
    )
    console.log('Updating placements with rotated placement')
    onPlacementUpdate(newPlacements)
  }

  const handleBackgroundClick = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current
    if (!svg) return

    // Get SVG coordinates
    const point = svg.createSVGPoint()
    point.x = e.clientX
    point.y = e.clientY
    const svgCoords = point.matrixTransform(svg.getScreenCTM()?.inverse())

    onBackgroundClick(svgCoords.x, svgCoords.y)
  }

  // Calculate if a placement is invalid
  const isPlacementInvalid = (placement: Placement): boolean => {
    // Use correct plate dimensions (offcut or regular plate)
    const effectivePlateConfig: PlateConfig = {
      ...plateConfig,
      width: plateWidth,
      height: plateHeight,
    }

    // During drag: check temp position
    if (draggingPlacement && placement.item.id === draggingPlacement.item.id && tempPosition) {
      const testPlacement: Placement = {
        ...placement,
        x: tempPosition.x,
        y: tempPosition.y,
      }
      const otherPlacements = pattern.placements.filter((p) => p.item.id !== placement.item.id)
      return !isValidPlacement(
        testPlacement,
        otherPlacements,
        effectivePlateConfig,
        effectiveCutConfig
      )
    }

    // After drag: check actual placement position
    const otherPlacements = pattern.placements.filter((p) => p.item.id !== placement.item.id)
    return !isValidPlacement(placement, otherPlacements, effectivePlateConfig, effectiveCutConfig)
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            配置図 - パターン {pattern.patternId}
            {pattern.isOffcut && pattern.offcutInfo && ` (${pattern.offcutInfo.name})`}
            <span className="ml-2 text-sm font-normal text-blue-600">(編集モード)</span>
          </h3>

          {/* Navigation buttons */}
          {totalPatterns && totalPatterns > 1 && currentIndex !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {currentIndex + 1} / {totalPatterns}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={onPrevPattern}
                  disabled={currentIndex === 0}
                  className="px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="前のパターン"
                >
                  ← 前
                </button>
                <button
                  onClick={onNextPattern}
                  disabled={currentIndex === totalPatterns - 1}
                  className="px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="次のパターン"
                >
                  次 →
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Diagram info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">パターンID</p>
            <p className="font-bold text-gray-900">{pattern.patternId}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">
              {pattern.isOffcut ? '端材サイズ' : '元板サイズ'}
            </p>
            <p className="font-bold text-gray-900">
              {plateWidth}×{plateHeight}mm
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">製品数</p>
            <p className="font-bold text-gray-900">{pattern.placements.length} 個</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">歩留まり</p>
            <p className="font-bold text-gray-900">{pattern.yield.toFixed(1)}%</p>
          </div>
        </div>

        {/* SVG Diagram */}
        <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-auto">
          <svg
            ref={svgRef}
            width={viewWidth}
            height={viewHeight}
            viewBox={`0 0 ${plateWidth} ${plateHeight}`}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Plate background */}
            <rect
              x={0}
              y={0}
              width={plateWidth}
              height={plateHeight}
              fill="#f9fafb"
              stroke="#d1d5db"
              strokeWidth={2}
            />

            {/* Margin area (darker background) */}
            <rect
              x={effectiveX}
              y={effectiveY}
              width={effectiveWidth}
              height={effectiveHeight}
              fill="#ffffff"
              stroke="#9ca3af"
              strokeWidth={1}
              strokeDasharray="5,5"
              onClick={handleBackgroundClick}
              style={{ cursor: selectedPlacement ? 'crosshair' : 'default' }}
            />

            {/* Snap Guide */}
            {snapEnabled && currentSnapPoint && (
              <SnapGuide
                snapPoint={currentSnapPoint}
                draggedPlacement={draggingPlacement}
                plateWidth={plateWidth}
                plateHeight={plateHeight}
              />
            )}

            {/* Draggable Placements */}
            {pattern.placements.map((placement, index) => {
              const placementId = getPlacementId(placement)
              const isSelected = selectedPlacements.has(placementId)
              return (
                <DraggableProduct
                  key={`${placement.item.id}-${index}`}
                  placement={placement}
                  svgRef={svgRef}
                  isInvalid={isPlacementInvalid(placement)}
                  isSelected={isSelected}
                  placementId={placementId}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  onClick={handlePlacementClick}
                  onSelectionToggle={onSelectionToggle}
                  onRotate={handleRotate}
                />
              )
            })}
          </svg>
        </div>
      </div>
    </Card>
  )
}
