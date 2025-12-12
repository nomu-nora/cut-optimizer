/**
 * Genetic Algorithm (遺伝的アルゴリズム) for Maximal Rectangles
 *
 * 配置順序とヒューリスティックの組み合わせを進化させて、
 * より良い配置パターンを探索する
 */

import type { Item, PlateConfig, CutConfig, CalculationResult } from '@/types'
import { calculateMaximalRectangles, type OptimizationGoal } from './maximal-rectangles'
import { sortByArea, sortByWidth, sortByHeight, sortByLongEdge, sortByShortEdge } from './sort'

/**
 * ソート戦略の種類
 */
type SortStrategy = 'area' | 'width' | 'height' | 'long-edge' | 'short-edge'

/**
 * ヒューリスティックの種類
 * 注: 現在未使用だが、将来の拡張用に定義を残す
 */
// type Heuristic = 'best-short-side-fit' | 'best-long-side-fit' | 'best-area-fit' | 'bottom-left'

/**
 * 個体（Individual）: 配置戦略の遺伝子
 */
interface Individual {
  /** ソート戦略 */
  sortStrategy: SortStrategy
  /** 製品の配置順序（インデックスの順列） */
  itemOrder: number[]
  /** 適応度スコア */
  fitness: number
  /** 計算結果 */
  result: CalculationResult | null
}

/**
 * GAのパラメータ
 */
interface GAOptions {
  /** 個体数（デフォルト: 20） */
  populationSize?: number
  /** 世代数（デフォルト: 15） */
  generations?: number
  /** 突然変異率（デフォルト: 0.2） */
  mutationRate?: number
  /** エリート保存数（デフォルト: 2） */
  eliteCount?: number
}

/**
 * 適応度を計算
 *
 * スコア = -総枚数 * 1000 + 歩留まり + 余りスペース品質 * 10
 */
function calculateFitness(result: CalculationResult, optimizationGoal: OptimizationGoal): number {
  // 元板枚数が少ないほど高得点（最優先）
  const plateScore = -result.totalPlates * 1000

  // 最適化目標に応じてスコアを調整
  switch (optimizationGoal) {
    case 'yield':
      return plateScore + result.averageYield

    case 'remaining-space':
      // 余りスペース品質を重視（ただし、これは内部的に計算されないので、簡易的に歩留まりで代用）
      return plateScore + result.averageYield * 0.5
  }
}

/**
 * 製品をソート戦略に応じてソート
 */
function sortItems(items: Item[], strategy: SortStrategy): Item[] {
  switch (strategy) {
    case 'area':
      return sortByArea(items)
    case 'width':
      return sortByWidth(items)
    case 'height':
      return sortByHeight(items)
    case 'long-edge':
      return sortByLongEdge(items)
    case 'short-edge':
      return sortByShortEdge(items)
  }
}

/**
 * 配置順序に応じて製品を並べ替え
 */
function reorderItems(items: Item[], order: number[]): Item[] {
  return order.map((index) => items[index])
}

/**
 * 個体を評価（適応度を計算）
 */
function evaluateIndividual(
  individual: Individual,
  items: Item[],
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  optimizationGoal: OptimizationGoal,
  useGridGrouping: boolean
): void {
  try {
    // ソート戦略を適用
    const sortedItems = sortItems(items, individual.sortStrategy)

    // 配置順序を適用
    const orderedItems = reorderItems(sortedItems, individual.itemOrder)

    // Maximal Rectanglesで計算
    const result = calculateMaximalRectangles(
      plateConfig,
      cutConfig,
      orderedItems,
      optimizationGoal,
      useGridGrouping
    )

    individual.result = result
    individual.fitness = calculateFitness(result, optimizationGoal)
  } catch {
    // エラーが発生した場合、適応度を最低にする
    individual.fitness = -Infinity
    individual.result = null
  }
}

/**
 * 初期集団を生成
 */
function initializePopulation(populationSize: number, itemCount: number): Individual[] {
  const population: Individual[] = []
  const sortStrategies: SortStrategy[] = ['area', 'width', 'height', 'long-edge', 'short-edge']

  for (let i = 0; i < populationSize; i++) {
    // ランダムなソート戦略
    const sortStrategy = sortStrategies[Math.floor(Math.random() * sortStrategies.length)]

    // ランダムな配置順序（Fisher-Yates shuffle）
    const itemOrder = Array.from({ length: itemCount }, (_, i) => i)
    for (let j = itemOrder.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[itemOrder[j], itemOrder[k]] = [itemOrder[k], itemOrder[j]]
    }

    population.push({
      sortStrategy,
      itemOrder,
      fitness: 0,
      result: null,
    })
  }

  return population
}

/**
 * トーナメント選択
 */
function tournamentSelection(population: Individual[], tournamentSize: number = 3): Individual {
  const tournament: Individual[] = []

  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length)
    tournament.push(population[randomIndex])
  }

  // 適応度が最も高い個体を選択
  return tournament.reduce((best, current) => (current.fitness > best.fitness ? current : best))
}

/**
 * 順序交叉（Order Crossover, OX）
 */
function orderCrossover(parent1: Individual, parent2: Individual): Individual {
  const length = parent1.itemOrder.length

  // 交叉点をランダムに選択
  const start = Math.floor(Math.random() * length)
  const end = Math.floor(Math.random() * (length - start)) + start

  // 親1から部分配列をコピー
  const child: number[] = new Array(length).fill(-1)
  for (let i = start; i <= end; i++) {
    child[i] = parent1.itemOrder[i]
  }

  // 親2から残りを順番に埋める
  let parent2Index = 0
  for (let i = 0; i < length; i++) {
    if (child[i] === -1) {
      // まだ使われていない要素を探す
      while (child.includes(parent2.itemOrder[parent2Index])) {
        parent2Index++
      }
      child[i] = parent2.itemOrder[parent2Index]
      parent2Index++
    }
  }

  // ソート戦略はランダムに選択
  const sortStrategy = Math.random() > 0.5 ? parent1.sortStrategy : parent2.sortStrategy

  return {
    sortStrategy,
    itemOrder: child,
    fitness: 0,
    result: null,
  }
}

/**
 * 突然変異
 */
function mutate(individual: Individual, mutationRate: number): void {
  // ソート戦略の突然変異
  if (Math.random() < mutationRate) {
    const sortStrategies: SortStrategy[] = ['area', 'width', 'height', 'long-edge', 'short-edge']
    individual.sortStrategy = sortStrategies[Math.floor(Math.random() * sortStrategies.length)]
  }

  // 配置順序の突然変異（スワップ）
  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * individual.itemOrder.length)
    const j = Math.floor(Math.random() * individual.itemOrder.length)
    ;[individual.itemOrder[i], individual.itemOrder[j]] = [
      individual.itemOrder[j],
      individual.itemOrder[i],
    ]
  }
}

/**
 * Genetic Algorithmで最適化
 */
export function optimizeWithGA(
  plateConfig: PlateConfig,
  cutConfig: CutConfig,
  items: Item[],
  optimizationGoal: OptimizationGoal = 'yield',
  useGridGrouping: boolean = false,
  options: GAOptions = {}
): CalculationResult {
  const { populationSize = 20, generations = 15, mutationRate = 0.2, eliteCount = 2 } = options

  // 初期集団の生成
  let population = initializePopulation(populationSize, items.length)

  // 初期集団の評価
  population.forEach((individual) => {
    evaluateIndividual(individual, items, plateConfig, cutConfig, optimizationGoal, useGridGrouping)
  })

  // 世代交代
  for (let gen = 0; gen < generations; gen++) {
    // 適応度でソート
    population.sort((a, b) => b.fitness - a.fitness)

    // エリート保存
    const newPopulation: Individual[] = population.slice(0, eliteCount)

    // 新しい個体を生成
    while (newPopulation.length < populationSize) {
      // 親の選択
      const parent1 = tournamentSelection(population)
      const parent2 = tournamentSelection(population)

      // 交叉
      const child = orderCrossover(parent1, parent2)

      // 突然変異
      mutate(child, mutationRate)

      // 評価
      evaluateIndividual(child, items, plateConfig, cutConfig, optimizationGoal, useGridGrouping)

      newPopulation.push(child)
    }

    population = newPopulation
  }

  // 最良の個体を返す
  population.sort((a, b) => b.fitness - a.fitness)
  const best = population[0]

  if (!best.result) {
    throw new Error('GAで最適解が見つかりませんでした。')
  }

  return best.result
}
