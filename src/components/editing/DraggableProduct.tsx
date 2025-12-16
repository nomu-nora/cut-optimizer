import { useState, useRef } from 'react'
import type { Placement } from '@/types'
import { SVGCoordinateTransform } from '@/lib/utils/svg-coordinates'

interface DraggableProductProps {
  /** 配置情報 */
  placement: Placement
  /** SVG要素の参照 */
  svgRef: React.RefObject<SVGSVGElement>
  /** 無効な配置かどうか */
  isInvalid?: boolean
  /** 選択されているかどうか */
  isSelected?: boolean
  /** ドラッグ開始時のコールバック */
  onDragStart?: (placement: Placement) => void
  /** ドラッグ中のコールバック */
  onDrag?: (x: number, y: number) => void
  /** ドラッグ終了時のコールバック */
  onDragEnd?: (x: number, y: number) => void
  /** クリック時のコールバック（仮置き場への移動用） */
  onClick?: (placement: Placement) => void
}

/**
 * ドラッグ可能な製品コンポーネント
 * Pointer Events APIを使用してドラッグ&ドロップを実装
 */
export function DraggableProduct({
  placement,
  svgRef,
  isInvalid = false,
  isSelected = false,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
}: DraggableProductProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: placement.x, y: placement.y })
  const rectRef = useRef<SVGRectElement>(null)

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // 左クリックのみ処理
    if (e.button !== 0) return

    const svg = svgRef.current
    if (!svg) return

    // SVG座標に変換
    const svgCoords = SVGCoordinateTransform.getEventSVGCoordinates(e.nativeEvent, svg)

    // ドラッグ開始位置とのオフセットを記録
    setDragOffset({
      x: svgCoords.x - placement.x,
      y: svgCoords.y - placement.y,
    })

    setIsDragging(true)
    setCurrentPos({ x: placement.x, y: placement.y })

    // ポインターキャプチャを設定
    if (rectRef.current) {
      rectRef.current.setPointerCapture(e.pointerId)
    }

    onDragStart?.(placement)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!isDragging) return

    const svg = svgRef.current
    if (!svg) return

    // SVG座標に変換
    const svgCoords = SVGCoordinateTransform.getEventSVGCoordinates(e.nativeEvent, svg)

    // オフセットを考慮した位置を計算
    const newX = svgCoords.x - dragOffset.x
    const newY = svgCoords.y - dragOffset.y

    setCurrentPos({ x: newX, y: newY })
    onDrag?.(newX, newY)
  }

  const handlePointerUp = (e: React.PointerEvent<SVGRectElement>) => {
    if (!isDragging) return

    setIsDragging(false)

    // ポインターキャプチャを解除
    if (rectRef.current) {
      rectRef.current.releasePointerCapture(e.pointerId)
    }

    onDragEnd?.(currentPos.x, currentPos.y)
  }

  const handleClick = (e: React.MouseEvent<SVGRectElement>) => {
    // ドラッグ後はクリックとして扱わない
    if (isDragging) {
      e.preventDefault()
      return
    }

    onClick?.(placement)
  }

  // 表示位置（ドラッグ中は現在位置、そうでなければ元の位置）
  const displayX = isDragging ? currentPos.x : placement.x
  const displayY = isDragging ? currentPos.y : placement.y

  // スタイルクラス
  const getStrokeColor = () => {
    if (isInvalid) return '#EF4444' // 赤（無効）
    if (isSelected) return '#3B82F6' // 青（選択中）
    if (isDragging) return '#3B82F6' // 青（ドラッグ中）
    return '#374151' // グレー（通常）
  }

  const getOpacity = () => {
    if (isDragging) return 0.6
    return 0.8
  }

  const getCursor = () => {
    if (isDragging) return 'grabbing'
    if (isHovered) return 'grab'
    return 'pointer'
  }

  return (
    <g>
      {/* 製品の矩形 */}
      <rect
        ref={rectRef}
        x={displayX}
        y={displayY}
        width={placement.width}
        height={placement.height}
        fill={placement.item.color}
        stroke={getStrokeColor()}
        strokeWidth={isSelected || isDragging || isInvalid ? 3 : 2}
        opacity={getOpacity()}
        style={{
          cursor: getCursor(),
          touchAction: 'none', // タッチデバイスでのスクロールを防ぐ
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onClick={handleClick}
      />

      {/* 無効な配置の場合、赤い半透明オーバーレイを表示 */}
      {isInvalid && (
        <rect
          x={displayX}
          y={displayY}
          width={placement.width}
          height={placement.height}
          fill="#EF4444"
          opacity={0.3}
          pointerEvents="none"
        />
      )}

      {/* 製品名ラベル */}
      <text
        x={displayX + placement.width / 2}
        y={displayY + placement.height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1F2937"
        fontSize="14"
        fontWeight="600"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {placement.item.name}
      </text>

      {/* サイズ表示 */}
      <text
        x={displayX + placement.width / 2}
        y={displayY + placement.height / 2 + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#4B5563"
        fontSize="11"
        pointerEvents="none"
        style={{ userSelect: 'none' }}
      >
        {placement.width}×{placement.height}
        {placement.rotated && ' (回転)'}
      </text>
    </g>
  )
}
