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
  {
    id: 'preset-4',
    name: '複雑な配置（GA推奨）',
    items: [
      {
        id: uuidv4(),
        name: 'パネルA',
        width: 500,
        height: 400,
        quantity: 8,
        color: COLOR_PALETTE[0],
      },
      {
        id: uuidv4(),
        name: 'パネルB',
        width: 700,
        height: 350,
        quantity: 6,
        color: COLOR_PALETTE[1],
      },
      {
        id: uuidv4(),
        name: 'パネルC',
        width: 600,
        height: 300,
        quantity: 7,
        color: COLOR_PALETTE[2],
      },
      {
        id: uuidv4(),
        name: 'パネルD',
        width: 450,
        height: 450,
        quantity: 5,
        color: COLOR_PALETTE[3],
      },
      {
        id: uuidv4(),
        name: 'パネルE',
        width: 550,
        height: 250,
        quantity: 6,
        color: COLOR_PALETTE[4],
      },
      {
        id: uuidv4(),
        name: 'パネルF',
        width: 400,
        height: 350,
        quantity: 7,
        color: COLOR_PALETTE[5],
      },
      {
        id: uuidv4(),
        name: 'パネルG',
        width: 380,
        height: 280,
        quantity: 5,
        color: COLOR_PALETTE[6],
      },
      {
        id: uuidv4(),
        name: 'パネルH',
        width: 520,
        height: 320,
        quantity: 4,
        color: COLOR_PALETTE[7],
      },
    ],
  },
  {
    id: 'preset-5',
    name: '実践的配置（GA必須）',
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
