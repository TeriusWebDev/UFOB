import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3.5 py-2.5 rounded-xl border text-gray-900 placeholder-gray-400 bg-white
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
            transition-shadow text-base
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-600 flex items-center gap-1">{error}</p>}
        {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
