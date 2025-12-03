import type { Plate, PatternGroup } from '@/types'

/**
 * 配置パターンをハッシュ化する
 * 同じ配置パターンを識別するための文字列を生成
 *
 * @param plate 元板
 * @returns パターンのハッシュ文字列
 */
function createPatternHash(plate: Plate): string {
  // 配置情報を文字列化してソート
  const placements = plate.placements
    .map((p) => `${p.item.name}_${p.x}_${p.y}_${p.width}_${p.height}_${p.rotated}`)
    .sort()
    .join('|')

  return placements
}

/**
 * パターンIDを生成する（A, B, C...）
 *
 * @param index パターンのインデックス
 * @returns パターンID
 */
function generatePatternId(index: number): string {
  return String.fromCharCode(65 + index) // A=65, B=66, C=67...
}

/**
 * 元板のリストをパターンごとにグループ化する
 * 同じ配置パターンを持つ元板をまとめる
 *
 * @param plates 元板のリスト
 * @returns パターングループのリスト（枚数が多い順）
 */
export function groupPatterns(plates: Plate[]): PatternGroup[] {
  const groups = new Map<string, PatternGroup>()

  // 各元板をハッシュ化してグループ分け
  for (const plate of plates) {
    const hash = createPatternHash(plate)

    if (groups.has(hash)) {
      // 既存パターンの枚数を増やす
      const group = groups.get(hash)!
      group.count++
    } else {
      // 新規パターンとして登録
      groups.set(hash, {
        patternId: '', // 後で割り当て
        placements: plate.placements,
        count: 1,
        yield: plate.yield,
      })
    }
  }

  // Map を配列に変換
  const patternList = Array.from(groups.values())

  // 枚数が多い順にソート
  patternList.sort((a, b) => b.count - a.count)

  // パターンIDを割り当て（A, B, C...）
  patternList.forEach((pattern, index) => {
    pattern.patternId = generatePatternId(index)
  })

  return patternList
}

/**
 * パターングループから総枚数を計算する
 *
 * @param patterns パターングループのリスト
 * @returns 総枚数
 */
export function getTotalPlatesFromPatterns(patterns: PatternGroup[]): number {
  return patterns.reduce((sum, pattern) => sum + pattern.count, 0)
}
