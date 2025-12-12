import { v4 as uuidv4 } from 'uuid'
import type { Item, OffcutPlate } from '@/types'
import { COLOR_PALETTE } from '@/types'

export interface Preset {
  id: string
  name: string
  items: Item[]
}

export interface OffcutPreset {
  id: string
  name: string
  offcuts: OffcutPlate[]
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'preset-2',
    name: '小さい製品',
    items: [
      {
        id: uuidv4(),
        name: '小物A',
        width: 200,
        height: 150,
        quantity: 10,
        color: COLOR_PALETTE[3],
      },
      {
        id: uuidv4(),
        name: '小物B',
        width: 250,
        height: 180,
        quantity: 8,
        color: COLOR_PALETTE[4],
      },
      {
        id: uuidv4(),
        name: '小物C',
        width: 180,
        height: 200,
        quantity: 6,
        color: COLOR_PALETTE[5],
      },
    ],
  },
  {
    id: 'preset-5',
    name: '実践的配置',
    items: [
      {
        id: uuidv4(),
        name: '天板A',
        width: 650,
        height: 420,
        quantity: 10,
        color: COLOR_PALETTE[0],
      },
      {
        id: uuidv4(),
        name: '天板B',
        width: 580,
        height: 380,
        quantity: 8,
        color: COLOR_PALETTE[1],
      },
      {
        id: uuidv4(),
        name: '側板A',
        width: 480,
        height: 360,
        quantity: 12,
        color: COLOR_PALETTE[2],
      },
      {
        id: uuidv4(),
        name: '側板B',
        width: 420,
        height: 320,
        quantity: 10,
        color: COLOR_PALETTE[3],
      },
      {
        id: uuidv4(),
        name: '棚板A',
        width: 550,
        height: 280,
        quantity: 6,
        color: COLOR_PALETTE[4],
      },
      {
        id: uuidv4(),
        name: '棚板B',
        width: 500,
        height: 250,
        quantity: 8,
        color: COLOR_PALETTE[5],
      },
      {
        id: uuidv4(),
        name: '小物A',
        width: 350,
        height: 220,
        quantity: 8,
        color: COLOR_PALETTE[6],
      },
      {
        id: uuidv4(),
        name: '小物B',
        width: 300,
        height: 200,
        quantity: 10,
        color: COLOR_PALETTE[7],
      },
    ],
  },
]

export const DEFAULT_OFFCUT_PRESETS: OffcutPreset[] = [
  {
    id: 'offcut-preset-1',
    name: '小型端材（小物向け）',
    offcuts: [
      {
        id: uuidv4(),
        name: '端材A',
        width: 400,
        height: 300,
        quantity: 2,
      },
      {
        id: uuidv4(),
        name: '端材B',
        width: 350,
        height: 250,
        quantity: 3,
      },
      {
        id: uuidv4(),
        name: '端材C',
        width: 280,
        height: 220,
        quantity: 2,
      },
    ],
  },
  {
    id: 'offcut-preset-2',
    name: 'テスト用セット',
    offcuts: [
      {
        id: uuidv4(),
        name: '端材A（大）',
        width: 700,
        height: 450,
        quantity: 1,
      },
      {
        id: uuidv4(),
        name: '端材B（中）',
        width: 605,
        height: 405,
        quantity: 2,
      },
      {
        id: uuidv4(),
        name: '端材C（中）',
        width: 550,
        height: 350,
        quantity: 2,
      },
      {
        id: uuidv4(),
        name: '端材D（小）',
        width: 400,
        height: 300,
        quantity: 2,
      },
    ],
  },
]
