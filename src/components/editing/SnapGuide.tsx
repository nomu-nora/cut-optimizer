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
      {/* 垂直ガイドライン */}
      <line
        x1={snapPoint.x}
        y1={0}
        x2={snapPoint.x}
        y2={plateHeight}
        stroke="#3B82F6"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.6}
      />

      {/* 水平ガイドライン */}
      <line
        x1={0}
        y1={snapPoint.y}
        x2={plateWidth}
        y2={snapPoint.y}
        stroke="#3B82F6"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.6}
      />

      {/* スナップポイントのマーカー */}
      <circle cx={snapPoint.x} cy={snapPoint.y} r={4} fill="#3B82F6" opacity={0.8} />

      {/* スナップポイントの外側の円（アニメーション用） */}
      <circle
        cx={snapPoint.x}
        cy={snapPoint.y}
        r={8}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        opacity={0.6}
      >
        <animate attributeName="r" from="8" to="12" dur="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.6" to="0" dur="0.6s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}
