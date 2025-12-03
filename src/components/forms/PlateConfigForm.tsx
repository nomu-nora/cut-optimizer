'use client'

import { useState } from 'react'
import { Input, Card } from '@/components/ui'
import type { PlateConfig } from '@/types'
import { DEFAULT_PLATE_CONFIG } from '@/types'

export interface PlateConfigFormProps {
  initialConfig?: PlateConfig
  onChange?: (config: PlateConfig) => void
}

export function PlateConfigForm({
  initialConfig = DEFAULT_PLATE_CONFIG,
  onChange,
}: PlateConfigFormProps) {
  const [config, setConfig] = useState<PlateConfig>(initialConfig)
  const [errors, setErrors] = useState<Partial<Record<keyof PlateConfig, string>>>({})

  const validateField = (field: keyof PlateConfig, value: number): string | undefined => {
    if (value <= 0) {
      return '0より大きい値を入力してください'
    }
    if (field === 'width' && value > 10000) {
      return '10000mm以下の値を入力してください'
    }
    if (field === 'height' && value > 10000) {
      return '10000mm以下の値を入力してください'
    }
    if (field === 'unitPrice' && value > 1000000) {
      return '1,000,000円以下の値を入力してください'
    }
    return undefined
  }

  const handleChange = (field: keyof PlateConfig, value: string) => {
    const numValue = parseFloat(value)
    const error = validateField(field, numValue)

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }))

    const newConfig = {
      ...config,
      [field]: numValue || 0,
    }
    setConfig(newConfig)

    if (!error && onChange) {
      onChange(newConfig)
    }
  }

  return (
    <Card title="元板設定">
      <div className="space-y-4">
        <Input
          label="元板の幅 (mm)"
          type="number"
          value={config.width || ''}
          onChange={(e) => handleChange('width', e.target.value)}
          error={errors.width}
          fullWidth
          min="0"
          step="1"
          placeholder="例: 1820"
        />

        <Input
          label="元板の高さ (mm)"
          type="number"
          value={config.height || ''}
          onChange={(e) => handleChange('height', e.target.value)}
          error={errors.height}
          fullWidth
          min="0"
          step="1"
          placeholder="例: 910"
        />

        <Input
          label="元板の単価 (円)"
          type="number"
          value={config.unitPrice || ''}
          onChange={(e) => handleChange('unitPrice', e.target.value)}
          error={errors.unitPrice}
          fullWidth
          min="0"
          step="1"
          placeholder="例: 2000"
        />
      </div>
    </Card>
  )
}
