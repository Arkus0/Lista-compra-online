'use client'

import { InputHTMLAttributes, forwardRef, useState, useId } from 'react'
import { AlertCircle, Check } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showSuccessState?: boolean
  isValid?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showSuccessState = false,
      isValid = false,
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const hasError = !!error
    const showSuccess = showSuccessState && isValid && !hasError

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`
              block text-sm font-medium mb-1.5 transition-colors duration-200
              ${isFocused ? 'text-primary' : 'text-foreground'}
              ${hasError ? 'text-danger' : ''}
            `}
          >
            {label}
            {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={`
                absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                ${isFocused ? 'text-primary' : 'text-muted-light'}
                ${hasError ? 'text-danger' : ''}
              `}
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            className={`
              w-full px-4 py-3 rounded-xl border-2
              bg-input-bg text-foreground
              placeholder:text-muted-light
              focus:outline-none focus:ring-0
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || hasError || showSuccess ? 'pr-10' : ''}
              ${hasError
                ? 'border-danger focus:border-danger shake'
                : showSuccess
                  ? 'border-success focus:border-success'
                  : 'border-border focus:border-primary'
              }
              ${className}
            `}
            {...props}
          />
          {/* Right side icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasError && (
              <AlertCircle className="w-5 h-5 text-danger animate-in fade-in duration-200" aria-hidden="true" />
            )}
            {showSuccess && (
              <Check className="w-5 h-5 text-success check-bounce" aria-hidden="true" />
            )}
            {!hasError && !showSuccess && rightIcon && (
              <div className="text-muted-light" aria-hidden="true">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-danger flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
        {/* Helper text */}
        {!hasError && helperText && (
          <p id={helperId} className="mt-1.5 text-sm text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
