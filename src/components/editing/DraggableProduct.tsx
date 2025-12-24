import { useState, useRef, useEffect } from 'react'
import type { Placement } from '@/types'
import { SVGCoordinateTransform } from '@/lib/utils/svg-coordinates'

interface DraggableProductProps {
  /** 配置情報 */
  placement: Placement
  /** SVG要素の参照 */
  svgRef: React.RefObject<SVGSVGElement | null>
  /** 無効な配置かどうか */
  isInvalid?: boolean
  /** 選択されているかどうか */
  isSelected?: boolean
  /** Placement ID (for multi-selection) */
  placementId?: string
  /** ドラッグ開始時のコールバック */
  onDragStart?: (placement: Placement) => void
  /** ドラッグ中のコールバック */
  onDrag?: (x: number, y: number) => void
  /** ドラッグ終了時のコールバック */
  onDragEnd?: (x: number, y: number) => void
  /** クリック時のコールバック（仮置き場への移動用） */
  onClick?: (placement: Placement) => void
  /** 選択切り替えコールバック（Ctrl/Shift+Click用） */
  onSelectionToggle?: (placementId: string, mode: 'toggle' | 'add' | 'set') => void
  /** 回転時のコールバック */
  onRotate?: (placement: Placement) => void
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
  placementId,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  onSelectionToggle,
  onRotate,
}: DraggableProductProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: placement.x, y: placement.y })
  const [hasDragged, setHasDragged] = useState(false) // ドラッグが実際に発生したかを追跡
  const [lastClickTime, setLastClickTime] = useState(0) // ダブルクリック検出用
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null) // シングルクリック遅延用
  const rectRef = useRef<SVGRectElement>(null)

  // クリーンアップ: コンポーネントアンマウント時にタイムアウトをクリア
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [])

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
    setHasDragged(false) // リセット
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

    // 実際にドラッグが発生したことをマーク
    setHasDragged(true)
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
    // ドラッグが発生した場合はクリックとして扱わない
    if (hasDragged) {
      e.preventDefault()
      e.stopPropagation()
      return
    }

    const now = Date.now()

    // Check for modifier keys (Ctrl/Cmd or Shift) - for multi-selection
    const isCtrlOrCmd = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey

    if ((isCtrlOrCmd || isShift) && onSelectionToggle && placementId) {
      // Modifier key pressed → handle selection (immediate, no delay)
      console.log(
        `Selection click: ${isCtrlOrCmd ? 'Ctrl/Cmd' : 'Shift'}+Click on ${placement.item.name}`
      )
      e.preventDefault()
      e.stopPropagation()

      // Clear any pending single-click timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout)
        setClickTimeout(null)
      }

      const mode = isCtrlOrCmd ? 'toggle' : isShift ? 'add' : 'set'
      onSelectionToggle(placementId, mode)
      setLastClickTime(0) // Reset to prevent double-click detection
      return
    }

    // ダブルクリック検出（300ms以内の2回目のクリック）
    if (now - lastClickTime < 300 && lastClickTime > 0) {
      // ダブルクリック → 回転
      console.log('Double-click detected, rotating...')
      e.preventDefault()
      e.stopPropagation()

      // シングルクリックのタイムアウトをキャンセル
      if (clickTimeout) {
        clearTimeout(clickTimeout)
        setClickTimeout(null)
      }

      onRotate?.(placement)
      setLastClickTime(0) // リセット
      return
    }

    // シングルクリック: 300ms待ってからダブルクリックでないことを確認
    setLastClickTime(now)

    // 既存のタイムアウトをクリア
    if (clickTimeout) {
      clearTimeout(clickTimeout)
    }

    // 300ms後にシングルクリックとして処理
    const timeout = setTimeout(() => {
      console.log('Single-click confirmed, moving to staging...')
      onClick?.(placement)
      setClickTimeout(null)
    }, 300)

    setClickTimeout(timeout)
  }

  const handleRotateClick = (e: React.PointerEvent<SVGCircleElement>) => {
    console.log('Rotate button clicked')
    e.preventDefault()
    e.stopPropagation()

    // タイムアウトをクリア（シングルクリックを防ぐ）
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
    }

    onRotate?.(placement)
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
      {/* 斜線パターン定義（無効な配置用） */}
      <defs>
        <pattern
          id={`error-pattern-${placement.item.id}`}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#EF4444" strokeWidth="3" />
        </pattern>
      </defs>

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

      {/* 無効な配置の場合、赤い斜線パターンと半透明オーバーレイを表示 */}
      {isInvalid && (
        <>
          {/* 斜線パターン */}
          <rect
            x={displayX}
            y={displayY}
            width={placement.width}
            height={placement.height}
            fill={`url(#error-pattern-${placement.item.id})`}
            opacity={0.6}
            pointerEvents="none"
          />
          {/* 半透明オーバーレイ */}
          <rect
            x={displayX}
            y={displayY}
            width={placement.width}
            height={placement.height}
            fill="#EF4444"
            opacity={0.2}
            pointerEvents="none"
          />
        </>
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

      {/* 回転ボタン（ホバー時または選択時に表示） */}
      {(isHovered || isSelected) && !isDragging && onRotate && (
        <g onPointerEnter={() => setIsHovered(true)} onPointerLeave={() => setIsHovered(false)}>
          {/* 透明なクリック領域（大きめ） */}
          <circle
            cx={displayX + placement.width - 20}
            cy={displayY + 20}
            r="24"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onPointerDown={handleRotateClick}
          />
          {/* ボタン背景 */}
          <circle
            cx={displayX + placement.width - 20}
            cy={displayY + 20}
            r="18"
            fill="#FFFFFF"
            stroke="#3B82F6"
            strokeWidth="2"
            pointerEvents="none"
          />
          {/* 回転アイコン（矢印） */}
          <path
            d={`M ${displayX + placement.width - 20} ${displayY + 11}
                A 9 9 0 1 1 ${displayX + placement.width - 20} ${displayY + 29}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            pointerEvents="none"
          />
          {/* 矢印の先端 */}
          <path
            d={`M ${displayX + placement.width - 20} ${displayY + 29}
                L ${displayX + placement.width - 24} ${displayY + 25}
                M ${displayX + placement.width - 20} ${displayY + 29}
                L ${displayX + placement.width - 16} ${displayY + 25}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            pointerEvents="none"
          />
        </g>
      )}
    </g>
  )
}
