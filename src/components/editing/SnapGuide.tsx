import type { SnapPoint, Placement } from '@/types'

interface SnapGuideProps {
  /** スナップポイント（nullの場合は非表示） */
  snapPoint: SnapPoint | null
  /** ドラッグ中の製品 */
  draggedPlacement: Placement | null
  /** 元板の幅 */
  plateWidth: number
  /** 元板の高さ */
  plateHeight: number
}

/**
 * スナップガイドコンポーネント
 * ドラッグ中にスナップポイントに近づいたときに破線ガイドを表示
 */
export function SnapGuide({
  snapPoint,
  draggedPlacement,
  plateWidth,
  plateHeight,
}: SnapGuideProps) {
  if (!snapPoint || !draggedPlacement) {
    return null
  }

  return (
    <g className="snap-guide" pointerEvents="none">
      {/* 垂直ガイドライン（影付き） */}
      <line
        x1={snapPoint.x}
        y1={0}
        x2={snapPoint.x}
        y2={plateHeight}
        stroke="#000000"
        strokeWidth={3}
        strokeDasharray="8 6"
        opacity={0.15}
      />
      <line
        x1={snapPoint.x}
        y1={0}
        x2={snapPoint.x}
        y2={plateHeight}
        stroke="#F59E0B"
        strokeWidth={2.5}
        strokeDasharray="8 6"
        opacity={0.9}
      />

      {/* 水平ガイドライン（影付き） */}
      <line
        x1={0}
        y1={snapPoint.y}
        x2={plateWidth}
        y2={snapPoint.y}
        stroke="#000000"
        strokeWidth={3}
        strokeDasharray="8 6"
        opacity={0.15}
      />
      <line
        x1={0}
        y1={snapPoint.y}
        x2={plateWidth}
        y2={snapPoint.y}
        stroke="#F59E0B"
        strokeWidth={2.5}
        strokeDasharray="8 6"
        opacity={0.9}
      />

      {/* スナップポイントのマーカー（白い縁取り） */}
      <circle cx={snapPoint.x} cy={snapPoint.y} r={7} fill="#FFFFFF" opacity={0.9} />
      <circle cx={snapPoint.x} cy={snapPoint.y} r={5} fill="#F59E0B" opacity={1} />

      {/* スナップポイントの外側の円（パルスアニメーション） */}
      <circle
        cx={snapPoint.x}
        cy={snapPoint.y}
        r={10}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={3}
        opacity={0.7}
      >
        <animate attributeName="r" from="10" to="16" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.7" to="0" dur="1s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}
