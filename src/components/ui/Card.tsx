import { HTMLAttributes, ReactNode, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  children: ReactNode
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, children, noPadding = false, className = '', ...props }, ref) => {
    const paddingStyle = noPadding ? '' : 'p-4 sm:p-6'

    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}
        {...props}
      >
        {title && (
          <div
            className={`border-b border-gray-200 ${noPadding ? 'px-4 sm:px-6 py-4' : 'pb-4 mb-4'}`}
          >
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        )}
        <div className={noPadding && !title ? '' : paddingStyle}>{children}</div>
      </div>
    )
  }
)

Card.displayName = 'Card'
