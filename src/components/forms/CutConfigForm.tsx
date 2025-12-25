'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui'
import type { CutConfig } from '@/types'
import { DEFAULT_CUT_CONFIG } from '@/types'

export interface CutConfigFormProps {
  initialConfig?: CutConfig
  onChange?: (config: CutConfig) => void
}

export function CutConfigForm({
  initialConfig = DEFAULT_CUT_CONFIG,
  onChange,
}: CutConfigFormProps) {
  const [config, setConfig] = useState<CutConfig>(initialConfig)
  const [errors, setErrors] = useState<Partial<Record<keyof CutConfig, string>>>({})

  // Update internal state when initialConfig changes
  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  const validateField = (field: keyof CutConfig, value: number): string | undefined => {
    if (value < 0) {
      return '0以上の値を入力してください'
    }
    if (field === 'cutWidth' && value > 100) {
      return '100mm以下の値を入力してください'
    }
    if (field === 'margin' && value > 500) {
      return '500mm以下の値を入力してください'
    }
    return undefined
  }

  const handleChange = (field: keyof CutConfig, value: string) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId?: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault()
      const nextField = document.getElementById(nextFieldId)
      if (nextField) {
        nextField.focus()
      }
    }
  }

  return (
    <div className="space-y-4">
      <Input
        id="cut-width"
        label="カット幅 (mm)"
        type="number"
        value={config.cutWidth || ''}
        onChange={(e) => handleChange('cutWidth', e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, 'cut-margin')}
        error={errors.cutWidth}
        helperText="製品と製品の間のカット幅"
        fullWidth
        min="0"
        step="0.1"
        placeholder="例: 4"
      />

      <Input
        id="cut-margin"
        label="余白 (mm)"
        type="number"
        value={config.margin || ''}
        onChange={(e) => handleChange('margin', e.target.value)}
        error={errors.margin}
        helperText="元板の四辺に設ける余白"
        fullWidth
        min="0"
        step="1"
        placeholder="例: 20"
      />
    </div>
  )
}
