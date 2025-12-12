# データフロー設計書

**プロジェクト**: 取り数最適化システム v1.0
**作成日**: 2025年12月2日
**Issue**: #2

---

## 1. 全体のデータフロー

### 1.1 基本フロー

```
┌──────────────────────────────────────────────────────────────┐
│                     ユーザーインタラクション                      │
└────────────┬─────────────────────────────────┬───────────────┘
             │                                 │
             ▼                                 ▼
    ┌────────────────┐                ┌────────────────┐
    │   入力フォーム    │                │   アクション     │
    │  - 元板設定      │                │  - 計算実行     │
    │  - 切断設定      │                │  - 印刷         │
    │  - 製品入力      │                │  - クリア       │
    └────────┬───────┘                └────────┬───────┘
             │                                 │
             ▼                                 ▼
    ┌────────────────────────────────────────────────┐
    │              バリデーション                       │
    │  - 必須項目チェック                              │
    │  - 数値範囲チェック                              │
    │  - 論理チェック                                  │
    └────────┬───────────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────────────────┐
    │              状態管理 (Context)                  │
    │  - plateConfig: PlateConfig                   │
    │  - cutConfig: CutConfig                       │
    │  - items: Item[]                              │
    │  - result: CalculationResult | null           │
    └────────┬───────────────────────────────────┘
             │
             ├─────────────────────────────────────┐
             │                                     │
             ▼                                     ▼
    ┌─────────────────┐              ┌────────────────────┐
    │ ローカルストレージ  │              │  アルゴリズム実行   │
    │  - 自動保存        │              │  - ソート          │
    │  - 復元           │              │  - 配置計算        │
    └─────────────────┘              │  - パターン化      │
                                      │  - 歩留まり計算    │
                                      └──────┬─────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   計算結果生成    │
                                    │  - patterns      │
                                    │  - totalPlates   │
                                    │  - averageYield  │
                                    │  - totalCost     │
                                    └──────┬──────────┘
                                           │
                                           ▼
                                    ┌─────────────────┐
                                    │   UI更新         │
                                    │  - 結果表示      │
                                    │  - 配置図描画    │
                                    └─────────────────┘
```

---

## 2. 入力フロー詳細

### 2.1 元板設定の入力フロー

```typescript
// ユーザー入力
onChange(event) → value

// バリデーション
validatePlateSize(width, height)
  ├─ width > 0 && width <= 10000
  ├─ height > 0 && height <= 10000
  └─ エラーメッセージ表示

// 状態更新
setPlateConfig({
  width: number,
  height: number,
  unitPrice: number
})

// ローカルストレージに保存
localStorage.setItem('plateConfig', JSON.stringify(config))
```

### 2.2 製品入力の入力フロー

```typescript
// 製品追加フォーム
addItem(item: Item)
  ├─ バリデーション
  │   ├─ name: 空でない
  │   ├─ width > 0
  │   ├─ height > 0
  │   └─ quantity > 0
  │
  ├─ ID生成（UUID）
  ├─ 色割り当て（ランダム、既存製品は同じ色）
  │
  └─ 状態更新
      items: [...items, newItem]

// 製品編集
updateItem(id: string, item: Item)
  ├─ バリデーション
  └─ 状態更新
      items: items.map(i => i.id === id ? item : i)

// 製品削除
deleteItem(id: string)
  └─ 状態更新
      items: items.filter(i => i.id !== id)
```

### 2.3 色の割り当てロジック

```typescript
// 製品の色割り当て
function assignColor(itemName: string, existingItems: Item[]): string {
  // 既存の製品と同じ名前があれば、同じ色を使う
  const existingItem = existingItems.find((i) => i.name === itemName)
  if (existingItem) {
    return existingItem.color
  }

  // 新しい製品の場合、ランダムな色を生成
  // ただし、既に使われている色と重複しないようにする
  const usedColors = existingItems.map((i) => i.color)
  let newColor: string
  do {
    newColor = generateRandomColor()
  } while (usedColors.includes(newColor))

  return newColor
}

// ランダム色生成（視覚的に区別しやすい色）
function generateRandomColor(): string {
  const palette = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
    '#F8B739',
    '#52B788',
    '#E76F51',
    '#2A9D8F',
  ]
  return palette[Math.floor(Math.random() * palette.length)]
}
```

---

## 3. 計算フロー詳細

### 3.1 計算実行のトリガー

```typescript
// ユーザーが「計算実行」ボタンをクリック
onClick() → handleCalculate()

function handleCalculate() {
  // 1. 入力データの最終バリデーション
  const validation = validateAll(plateConfig, cutConfig, items)
  if (!validation.valid) {
    showError(validation.errors)
    return
  }

  // 2. ローディング状態に設定
  setIsCalculating(true)

  // 3. 計算実行
  try {
    const result = calculate(plateConfig, cutConfig, items)

    // 4. 結果を状態に保存
    setResult(result)

    // 5. 結果表示エリアにスクロール
    scrollToResults()

  } catch (error) {
    // エラーハンドリング
    showError('計算中にエラーが発生しました')
    console.error(error)

  } finally {
    // 6. ローディング状態を解除
    setIsCalculating(false)
  }
}
```

### 3.2 計算アルゴリズムのデータフロー

```typescript
// メイン計算関数
function calculate(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[]
): CalculationResult {
  // STEP 1: 前処理
  // 製品リストを展開（個数分に複製）
  const expandedItems = expandItems(items)
  // 例: [{name: 'A', qty: 3}] → [{name: 'A'}, {name: 'A'}, {name: 'A'}]

  // STEP 2: ソート
  // 面積の大きい順にソート
  const sortedItems = sortByArea(expandedItems)

  // STEP 3: 配置計算
  const plates: Plate[] = []
  let currentPlate = createNewPlate(plateConfig, cutConfig)

  for (const item of sortedItems) {
    // 現在の元板に配置を試みる
    const placed = tryPlaceItem(currentPlate, item, cutConfig)

    if (!placed) {
      // 配置できなかった場合、次の元板へ
      plates.push(currentPlate)
      currentPlate = createNewPlate(plateConfig, cutConfig)
      tryPlaceItem(currentPlate, item, cutConfig)
    }
  }

  // 最後の元板を追加
  if (currentPlate.placements.length > 0) {
    plates.push(currentPlate)
  }

  // STEP 4: パターングループ化
  const patterns = groupPatterns(plates)

  // STEP 5: 統計計算
  const totalPlates = plates.length
  const averageYield = calculateAverageYield(plates)
  const totalCost = totalPlates * plateConfig.unitPrice

  // STEP 6: 結果を返す
  return {
    patterns,
    totalPlates,
    averageYield,
    totalCost,
  }
}
```

### 3.3 配置計算の詳細フロー

```typescript
function tryPlaceItem(plate: Plate, item: Item, cutConfig: CutConfig): boolean {
  // 利用可能な空きスペースを取得
  const spaces = plate.freeSpaces

  for (const space of spaces) {
    // 回転なしで配置可能かチェック
    if (canPlace(item, space, cutConfig, false)) {
      placeItem(plate, item, space, cutConfig, false)
      return true
    }

    // 90度回転で配置可能かチェック
    if (canPlace(item, space, cutConfig, true)) {
      placeItem(plate, item, space, cutConfig, true)
      return true
    }
  }

  // どこにも配置できなかった
  return false
}

function placeItem(
  plate: Plate,
  item: Item,
  space: FreeSpace,
  cutConfig: CutConfig,
  rotated: boolean
) {
  // 1. 配置情報を作成
  const placement: Placement = {
    item,
    x: space.x,
    y: space.y,
    width: rotated ? item.height : item.width,
    height: rotated ? item.width : item.height,
    rotated,
  }

  // 2. 元板に配置を追加
  plate.placements.push(placement)

  // 3. 使用面積を更新
  plate.usedArea += item.width * item.height

  // 4. 空きスペースを更新
  const newSpaces = splitSpace(space, placement, cutConfig.cutWidth)

  // 使用したスペースを削除
  plate.freeSpaces = plate.freeSpaces.filter((s) => s !== space)

  // 新しい空きスペースを追加
  plate.freeSpaces.push(...newSpaces)

  // 5. 歩留まりを再計算
  plate.yield = calculateYield(plate, plateConfig, cutConfig)
}
```

### 3.4 パターングループ化のフロー

```typescript
function groupPatterns(plates: Plate[]): PatternGroup[] {
  const groups = new Map<string, PatternGroup>()

  for (const plate of plates) {
    // 配置パターンをハッシュ化（同じパターンを検出）
    const hash = createPatternHash(plate.placements)

    if (groups.has(hash)) {
      // 既存パターンの枚数を増やす
      const group = groups.get(hash)!
      group.count++
    } else {
      // 新しいパターンとして登録
      groups.set(hash, {
        patternId: generatePatternId(groups.size), // A, B, C...
        placements: plate.placements,
        count: 1,
        yield: plate.yield,
      })
    }
  }

  return Array.from(groups.values())
}

function createPatternHash(placements: Placement[]): string {
  // 配置パターンを一意に識別するハッシュを生成
  const sorted = placements
    .map((p) => `${p.item.name}_${p.x}_${p.y}_${p.width}_${p.height}`)
    .sort()
    .join('|')

  return sorted
}
```

---

## 4. 表示フロー詳細

### 4.1 結果表示の更新フロー

```typescript
// 計算結果が状態に保存されると、自動的にUIが更新される
useEffect(() => {
  if (result) {
    // 1. サマリー情報を表示
    renderSummary(result)

    // 2. パターン一覧を表示
    renderPatternList(result.patterns)

    // 3. 各パターンの配置図を描画
    result.patterns.forEach((pattern) => {
      renderPlateVisualization(pattern)
    })
  }
}, [result])
```

### 4.2 配置図の描画フロー（Canvas）

```typescript
function renderPlateVisualization(
  canvas: HTMLCanvasElement,
  pattern: PatternGroup,
  plateConfig: PlateConfig
) {
  const ctx = canvas.getContext('2d')!

  // 1. キャンバスサイズの設定
  const scale = calculateScale(plateConfig, canvas)

  // 2. 元板の枠を描画
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, plateConfig.width * scale, plateConfig.height * scale)

  // 3. 各製品を描画
  for (const placement of pattern.placements) {
    // 製品の矩形を描画
    ctx.fillStyle = placement.item.color
    ctx.fillRect(
      placement.x * scale,
      placement.y * scale,
      placement.width * scale,
      placement.height * scale
    )

    // 製品の枠線を描画
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(
      placement.x * scale,
      placement.y * scale,
      placement.width * scale,
      placement.height * scale
    )

    // 製品名を描画
    ctx.fillStyle = '#000'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      placement.item.name,
      (placement.x + placement.width / 2) * scale,
      (placement.y + placement.height / 2) * scale
    )
  }

  // 4. カット線を描画（オプション）
  drawCutLines(ctx, pattern.placements, cutConfig, scale)
}
```

### 4.3 インタラクティブ機能のフロー

```typescript
// ホバー時の情報表示
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect()
  const x = (event.clientX - rect.left) / scale
  const y = (event.clientY - rect.top) / scale

  // カーソル位置の製品を検出
  const hoveredPlacement = findPlacementAt(x, y, pattern.placements)

  if (hoveredPlacement) {
    // ツールチップを表示
    showTooltip({
      name: hoveredPlacement.item.name,
      size: `${hoveredPlacement.width} × ${hoveredPlacement.height}`,
      position: { x: event.clientX, y: event.clientY },
    })
  } else {
    hideTooltip()
  }
})
```

---

## 5. 状態管理とデータの受け渡し

### 5.1 Context API の実装

```typescript
// AppContext.tsx
interface AppState {
  // 入力データ
  plateConfig: PlateConfig
  cutConfig: CutConfig
  items: Item[]

  // 計算結果
  result: CalculationResult | null

  // UI状態
  isCalculating: boolean
  errors: ValidationError[]
}

interface AppActions {
  // 設定の更新
  setPlateConfig: (config: PlateConfig) => void
  setCutConfig: (config: CutConfig) => void

  // 製品の操作
  addItem: (item: Item) => void
  updateItem: (id: string, item: Partial<Item>) => void
  deleteItem: (id: string) => void

  // 計算
  calculate: () => void
  clearResult: () => void

  // その他
  clearAll: () => void
}

const AppContext = createContext<AppState & AppActions | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 状態管理
  const [state, dispatch] = useReducer(appReducer, initialState)

  // ローカルストレージと同期
  useEffect(() => {
    saveToLocalStorage(state)
  }, [state])

  // アクション関数
  const actions: AppActions = {
    setPlateConfig: (config) => dispatch({ type: 'SET_PLATE_CONFIG', payload: config }),
    setCutConfig: (config) => dispatch({ type: 'SET_CUT_CONFIG', payload: config }),
    addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
    updateItem: (id, item) => dispatch({ type: 'UPDATE_ITEM', payload: { id, item } }),
    deleteItem: (id) => dispatch({ type: 'DELETE_ITEM', payload: id }),
    calculate: () => {
      const result = calculate(state.plateConfig, state.cutConfig, state.items)
      dispatch({ type: 'SET_RESULT', payload: result })
    },
    clearResult: () => dispatch({ type: 'CLEAR_RESULT' }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' })
  }

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  )
}
```

### 5.2 コンポーネント間のデータの受け渡し

```
AppProvider (Context)
    │
    ├─ Header
    │
    ├─ InputSection
    │   ├─ PlateConfigForm ─────┐
    │   │   → useAppContext()   │ Context経由で
    │   │   → setPlateConfig()  │ データを更新
    │   │                        │
    │   ├─ CutConfigForm ────────┤
    │   │   → useAppContext()    │
    │   │   → setCutConfig()     │
    │   │                        │
    │   └─ ItemInputSection ─────┤
    │       ├─ ItemForm          │
    │       │   → addItem()      │
    │       │                    │
    │       └─ ItemList ─────────┘
    │           → deleteItem()
    │           → updateItem()
    │
    ├─ CalculateButton
    │   → useAppContext()
    │   → calculate()
    │
    └─ ResultSection
        ├─ ResultSummary ────────┐
        │   → useAppContext()    │ Context経由で
        │   → result             │ データを取得
        │                        │
        └─ PatternList ──────────┤
            └─ PatternCard       │
                → PlateVisualization
```

### 5.3 Props vs Context の使い分け

| データ種別                               | 伝達方法 | 理由                           |
| ---------------------------------------- | -------- | ------------------------------ |
| グローバル設定（plateConfig, cutConfig） | Context  | 複数コンポーネントで参照・更新 |
| 製品リスト（items）                      | Context  | 複数コンポーネントで参照・更新 |
| 計算結果（result）                       | Context  | 複数コンポーネントで参照       |
| UI表示状態（isCalculating）              | Context  | グローバルなローディング状態   |
| 個別製品の表示（ItemCard）               | Props    | 親から子への一方向の伝達       |
| パターンの表示（PatternCard）            | Props    | 親から子への一方向の伝達       |

---

## 6. ローカルストレージとの連携

### 6.1 自動保存のフロー

```typescript
// 入力データが変更されたら自動保存
useEffect(() => {
  const dataToSave = {
    plateConfig,
    cutConfig,
    items,
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem('cutOptimizer_data', JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}, [plateConfig, cutConfig, items])
```

### 6.2 データの復元フロー

```typescript
// アプリ起動時にデータを復元
function loadFromLocalStorage(): Partial<AppState> | null {
  try {
    const saved = localStorage.getItem('cutOptimizer_data')
    if (!saved) return null

    const data = JSON.parse(saved)

    // データの整合性チェック
    if (isValidSavedData(data)) {
      return {
        plateConfig: data.plateConfig,
        cutConfig: data.cutConfig,
        items: data.items,
      }
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
  }

  return null
}
```

---

## 7. エラーハンドリングフロー

### 7.1 エラーの種類と対応

```typescript
// エラーの種類
type ErrorType =
  | 'VALIDATION_ERROR' // 入力バリデーションエラー
  | 'CALCULATION_ERROR' // 計算処理エラー
  | 'RENDER_ERROR' // 描画エラー
  | 'STORAGE_ERROR' // ローカルストレージエラー

interface AppError {
  type: ErrorType
  message: string
  field?: string // エラーが発生したフィールド
  details?: any // 詳細情報
}
```

### 7.2 エラーハンドリングの流れ

```
ユーザー入力
    │
    ▼
バリデーション
    │
    ├─ OK ──────→ 処理続行
    │
    └─ NG ──────→ エラー表示
                      ├─ フィールドレベル（入力欄の下）
                      └─ フォームレベル（トースト通知）

計算実行
    │
    ├─ 成功 ─────→ 結果表示
    │
    └─ 失敗 ─────→ エラー表示
                      ├─ エラーメッセージ
                      ├─ エラーログ（開発者向け）
                      └─ リトライボタン

描画処理
    │
    ├─ 成功 ─────→ 配置図表示
    │
    └─ 失敗 ─────→ フォールバック表示
                      └─ 「描画できませんでした」
```

### 7.3 エラーバウンダリ

```typescript
// エラーバウンダリで予期しないエラーをキャッチ
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)

    // エラー情報を状態に保存
    this.setState({
      hasError: true,
      error
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>予期しないエラーが発生しました</h2>
          <button onClick={() => window.location.reload()}>
            ページを再読み込み
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 7.4 元板より大きい製品の扱い（v1.0での対応）

**仕様**: 元板より大きい製品は計算から除外し、警告を表示

```typescript
function validateItems(
  items: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig
): ValidationResult {
  const validItems: Item[] = []
  const skippedItems: Item[] = []
  const warnings: ValidationWarning[] = []

  // 有効エリアの計算
  const effectiveWidth = plateConfig.width - cutConfig.margin * 2
  const effectiveHeight = plateConfig.height - cutConfig.margin * 2

  for (const item of items) {
    // 回転なし・回転ありの両方で元板より大きいかチェック
    const fitsWithoutRotation = item.width <= effectiveWidth && item.height <= effectiveHeight
    const fitsWithRotation = item.height <= effectiveWidth && item.width <= effectiveHeight

    if (!fitsWithoutRotation && !fitsWithRotation) {
      // 両方とも入らない場合、スキップ
      warnings.push({
        type: 'ITEM_TOO_LARGE',
        itemId: item.id,
        itemName: item.name,
        message:
          `製品「${item.name}」(${item.width}×${item.height}mm)は` +
          `元板(${effectiveWidth}×${effectiveHeight}mm)より大きいため計算できません。`,
      })
      skippedItems.push(item)
    } else {
      validItems.push(item)
    }
  }

  return { validItems, skippedItems, warnings }
}
```

**UI表示フロー**:

```
計算実行ボタンをクリック
    │
    ▼
バリデーション実行
    │
    ├─ 元板より大きい製品を検出
    │
    ▼
警告ダイアログ表示
┌─────────────────────────────────────┐
│ ⚠ 警告                              │
│                                     │
│ 以下の製品は元板より大きいため      │
│ 計算から除外されました:             │
│                                     │
│ • 製品X (2000×1000mm)               │
│ • 製品Y (1900×950mm)                │
│                                     │
│ [計算を続行]  [キャンセル]          │
└─────────────────────────────────────┘
    │
    ▼ 「計算を続行」をクリック
    │
計算実行（除外した製品以外で計算）
    │
    ▼
結果表示 + スキップされた製品リスト
┌─────────────────────────────────────┐
│ 計算結果                            │
│ ...                                 │
├─────────────────────────────────────┤
│ ⚠ 計算されなかった製品 (2件)        │
│ • 製品X (2000×1000mm) - 元板より大  │
│ • 製品Y (1900×950mm) - 元板より大   │
└─────────────────────────────────────┘
```

**将来の拡張（v3.0以降）**:

- 分割裁断機能を実装し、大きい製品を自動分割して配置

---

## 8. パフォーマンス最適化のデータフロー

### 8.1 メモ化戦略

```typescript
// 計算結果のメモ化
const result = useMemo(() => {
  if (!shouldCalculate) return null
  return calculate(plateConfig, cutConfig, items)
}, [plateConfig, cutConfig, items, shouldCalculate])

// コールバック関数のメモ化
const handleAddItem = useCallback((item: Item) => {
  addItem(item)
}, [addItem])

// コンポーネントのメモ化
const PatternCard = React.memo(({ pattern }: Props) => {
  return <div>...</div>
}, (prevProps, nextProps) => {
  // カスタム比較関数
  return prevProps.pattern.patternId === nextProps.pattern.patternId
})
```

### 8.2 遅延レンダリング

```typescript
// 配置図の遅延描画（大量のパターンがある場合）
function PatternList({ patterns }: Props) {
  const [visibleCount, setVisibleCount] = useState(5)

  return (
    <div>
      {patterns.slice(0, visibleCount).map(pattern => (
        <PatternCard key={pattern.patternId} pattern={pattern} />
      ))}

      {visibleCount < patterns.length && (
        <button onClick={() => setVisibleCount(prev => prev + 5)}>
          さらに表示
        </button>
      )}
    </div>
  )
}
```

---

## 9. 印刷フロー

### 9.1 印刷処理のフロー

```
ユーザーが「印刷」ボタンをクリック
    │
    ▼
window.print() 実行
    │
    ▼
@media print CSS が適用
    ├─ 入力フォームを非表示
    ├─ 結果表示のみ表示
    ├─ ページ区切りを調整
    └─ カラー印刷用の色調整
    │
    ▼
印刷プレビュー表示
    │
    ├─ 印刷実行 → PDF保存 or プリンタ出力
    └─ キャンセル → 通常表示に戻る
```

### 9.2 印刷用のデータ調整

```typescript
// 印刷前の準備
function preparePrintData(result: CalculationResult) {
  // Canvas要素をSVGまたは画像に変換
  const canvases = document.querySelectorAll('.plate-canvas')

  canvases.forEach((canvas) => {
    // Canvasの内容を画像として保存
    const dataUrl = canvas.toDataURL('image/png')

    // 印刷用の要素に変換
    const img = document.createElement('img')
    img.src = dataUrl
    img.className = 'print-plate-image'

    canvas.parentElement?.appendChild(img)
  })

  // 印刷実行
  window.print()
}
```

---

## 10. 将来の拡張に向けたデータフロー

### 10.1 端材管理機能（v2.0）

```
端材データの追加
    │
    ▼
計算時に端材を優先的に使用
    │
    ├─ 端材から配置可能か判定
    │   ├─ 配置可能 → 端材に配置
    │   └─ 配置不可 → 新しい元板に配置
    │
    ▼
結果に端材使用状況を含める
```

### 10.2 手動配置調整機能（v1.5）

```
自動計算結果の表示
    │
    ▼
ユーザーが製品をドラッグ&ドロップ
    │
    ▼
配置可能性をリアルタイムで判定
    │
    ├─ 配置可能 → 配置を更新
    │   └─ 歩留まりを再計算
    │
    └─ 配置不可 → 元の位置に戻す
```

---

## 11. 成果物

### このIssueで明確にしたこと

- ✅ 入力から計算、表示までのデータフロー
- ✅ コンポーネント間のデータ受け渡し方法
- ✅ 状態管理の詳細設計
- ✅ エラーハンドリングフロー
- ✅ パフォーマンス最適化戦略

---

**Issue #2 完了条件**:

- [x] 入力フローの詳細設計
- [x] 計算フローの詳細設計
- [x] 表示フローの詳細設計
- [x] 状態管理とデータ受け渡しの設計
- [x] エラーハンドリングフローの設計
- [x] データフロー設計書の作成
