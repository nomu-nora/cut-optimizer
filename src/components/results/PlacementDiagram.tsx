import { Card } from '@/components/ui'
import type { PatternGroup, PlateConfig, CutConfig } from '@/types'

export interface PlacementDiagramProps {
  pattern: PatternGroup
  plateConfig: PlateConfig
  cutConfig: CutConfig
  // Navigation props
  currentIndex?: number
  totalPatterns?: number
  onPrevPattern?: () => void
  onNextPattern?: () => void
}

export function PlacementDiagram({
  pattern,
  plateConfig,
  cutConfig,
  currentIndex,
  totalPatterns,
  onPrevPattern,
  onNextPattern,
}: PlacementDiagramProps) {
  // Use offcut dimensions if this is an offcut pattern
  const plateWidth =
    pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.width : plateConfig.width
  const plateHeight =
    pattern.isOffcut && pattern.offcutInfo ? pattern.offcutInfo.height : plateConfig.height

  // Offcuts have no margin (already cut)
  const margin = pattern.isOffcut ? 0 : cutConfig.margin

  const SCALE = 0.4 // Scale factor to fit diagram on screen
  const viewWidth = plateWidth * SCALE
  const viewHeight = plateHeight * SCALE

  // Calculate effective area (with margins)
  const effectiveX = margin
  const effectiveY = margin
  const effectiveWidth = plateWidth - margin * 2
  const effectiveHeight = plateHeight - margin * 2

  return (
    <Card>
      <div className="space-y-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            配置図 - パターン {pattern.patternId}
            {pattern.isOffcut && pattern.offcutInfo && ` (${pattern.offcutInfo.name})`}
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
            />

            {/* Placements */}
            {pattern.placements.map((placement, index) => {
              // placement.width/height are already rotated sizes
              const displayWidth = placement.width
              const displayHeight = placement.height

              return (
                <g key={`${placement.item.id}-${index}`}>
                  {/* Product rectangle */}
                  <rect
                    x={placement.x}
                    y={placement.y}
                    width={displayWidth}
                    height={displayHeight}
                    fill={placement.item.color}
                    stroke="#374151"
                    strokeWidth={2}
                    opacity={0.8}
                  />

                  {/* Product name label */}
                  <text
                    x={placement.x + displayWidth / 2}
                    y={placement.y + displayHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={Math.min(displayWidth, displayHeight) * 0.15}
                    fontWeight="bold"
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                    }}
                  >
                    {placement.item.name}
                  </text>

                  {/* Dimensions */}
                  <text
                    x={placement.x + displayWidth / 2}
                    y={
                      placement.y + displayHeight / 2 + Math.min(displayWidth, displayHeight) * 0.12
                    }
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={Math.min(displayWidth, displayHeight) * 0.1}
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      pointerEvents: 'none',
                    }}
                  >
                    {displayWidth} × {displayHeight}
                    {placement.rotated && ' (回転)'}
                  </text>
                </g>
              )
            })}

            {/* Dimensions labels */}
            <text
              x={plateWidth / 2}
              y={plateHeight - 5}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={40}
              fontWeight="bold"
            >
              {plateWidth} mm
            </text>
            <text
              x={plateWidth - 5}
              y={plateHeight / 2}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={40}
              fontWeight="bold"
              transform={`rotate(-90, ${plateWidth - 5}, ${plateHeight / 2})`}
            >
              {plateHeight} mm
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">凡例</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-400 bg-white mr-2"></div>
              <span className="text-gray-600">
                {pattern.isOffcut ? '端材' : '元板'} ({plateWidth} × {plateHeight} mm)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border border-gray-400 border-dashed bg-white mr-2"></div>
              <span className="text-gray-600">有効エリア (余白: {margin} mm)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
