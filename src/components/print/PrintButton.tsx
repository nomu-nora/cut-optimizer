'use client'

import { Button } from '@/components/ui'

export interface PrintButtonProps {
  onPrint?: () => void
  disabled?: boolean
}

export function PrintButton({ onPrint, disabled = false }: PrintButtonProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <Button
      onClick={handlePrint}
      disabled={disabled}
      variant="primary"
      className="no-print"
    >
      <svg
        className="w-5 h-5 mr-2 inline-block"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      印刷
    </Button>
  )
}
