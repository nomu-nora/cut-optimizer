import { v4 as uuidv4 } from 'uuid'
import type { Item } from '@/types'
import { COLOR_PALETTE } from '@/types'

export interface Preset {
  id: string
  name: string
  items: Item[]
}

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'preset-1',
    name: '基本テスト',
    items: [
      {
        id: uuidv4(),
        name: '天板A',
        width: 600,
        height: 400,
        quantity: 5,
        color: COLOR_PALETTE[0],
      },
      {
        id: uuidv4(),
        name: '天板B',
        width: 800,
        height: 300,
        quantity: 3,
        color: COLOR_PALETTE[1],
      },
      {
        id: uuidv4(),
        name: '側板',
        width: 450,
        height: 350,
        quantity: 8,
        color: COLOR_PALETTE[2],
      },
    ],
  },
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
    id: 'preset-3',
    name: '大きい製品',
    items: [
      {
        id: uuidv4(),
        name: '大型天板',
        width: 1200,
        height: 600,
        quantity: 2,
        color: COLOR_PALETTE[6],
      },
      {
        id: uuidv4(),
        name: '大型側板',
        width: 1000,
        height: 700,
        quantity: 3,
        color: COLOR_PALETTE[7],
      },
    ],
  },
]
