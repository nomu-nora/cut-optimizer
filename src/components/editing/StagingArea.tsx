import type { StagingArea, Placement } from '@/types'

interface StagingAreaProps {
  /** 仮置き場の状態 */
  stagingArea: StagingArea
  /** 選択中の製品 */
  selectedPlacement: Placement | null
  /** 製品を選択 */
  onSelectPlacement: (placement: Placement) => void
}

// Helper function to extract base item ID (UUID portion)
const getBaseItemId = (itemId: string): string => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  const match = itemId.match(uuidPattern)
  return match ? match[0] : itemId
}

interface GroupedProduct {
  baseId: string
  product: Placement // 代表となる製品
  count: number // 同じ製品の数量
}

/**
 * 仮置き場コンポーネント
 * パターン間移動のために一時的に製品を保持する場所
 */
export function StagingAreaComponent({
  stagingArea,
  selectedPlacement,
  onSelectPlacement,
}: StagingAreaProps) {
  const { products } = stagingArea

  // 製品をベースIDでグループ化
  const groupedProducts: GroupedProduct[] = []
  const groupMap = new Map<string, GroupedProduct>()

  for (const product of products) {
    const baseId = getBaseItemId(product.item.id)
    const existing = groupMap.get(baseId)

    if (existing) {
      existing.count++
    } else {
      const group: GroupedProduct = {
        baseId,
        product,
        count: 1,
      }
      groupMap.set(baseId, group)
      groupedProducts.push(group)
    }
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">仮置き場</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">0個</span>
        </div>
        <div className="text-sm text-gray-500 text-center py-6 border-2 border-dashed border-gray-200 rounded">
          製品をクリックすると
          <br />
          ここに移動します
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">仮置き場</h3>
        <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded font-medium">
          {products.length}個
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {groupedProducts.map((group, index) => {
          const product = group.product
          const isSelected =
            selectedPlacement && getBaseItemId(selectedPlacement.item.id) === group.baseId
          return (
            <button
              key={`${group.baseId}-${index}`}
              type="button"
              onClick={() => onSelectPlacement(product)}
              className={`
                w-full text-left p-3 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                  style={{ backgroundColor: product.item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {product.item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {product.width} × {product.height} mm
                    {product.rotated && <span className="ml-1">(回転)</span>}
                  </div>
                </div>
                {group.count > 1 && (
                  <div className="flex-shrink-0 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-semibold">
                    ×{group.count}
                  </div>
                )}
                {isSelected && <span className="text-blue-500 text-lg flex-shrink-0">✓</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
        💡 配置したい製品をクリックしてから
        <br />
        配置図上の位置をクリックしてください
      </div>
    </div>
  )
}
