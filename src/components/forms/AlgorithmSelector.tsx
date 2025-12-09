'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'

export type AlgorithmType = 'guillotine' | 'maximal-rectangles'

interface AlgorithmOption {
  value: AlgorithmType
  label: string
  description: string
}

interface AlgorithmSelectorProps {
  value: AlgorithmType
  onChange: (algorithm: AlgorithmType) => void
}

const algorithms: AlgorithmOption[] = [
  {
    value: 'guillotine',
    label: 'ギロチンカット',
    description: '直線的な切断のみを使用（シンプル・高速）',
  },
  {
    value: 'maximal-rectangles',
    label: 'Maximal Rectangles',
    description: 'L字型の空きスペースも活用（高精度・推奨）',
  },
]

export function AlgorithmSelector({ value, onChange }: AlgorithmSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedAlgorithm = algorithms.find((algo) => algo.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-white border border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-gray-900">{selectedAlgorithm?.label}</div>
            <div className="text-sm text-gray-500 mt-0.5">{selectedAlgorithm?.description}</div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {algorithms.map((algo) => (
            <button
              key={algo.value}
              type="button"
              onClick={() => {
                onChange(algo.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                value === algo.value ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{algo.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{algo.description}</div>
                </div>
                {value === algo.value && (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
