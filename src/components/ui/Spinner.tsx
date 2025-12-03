import { HTMLAttributes } from 'react'

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Spinner({ size = 'md', text, className = '', ...props }: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      <div
        className={`${sizeStyles[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="読み込み中"
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  )
}
