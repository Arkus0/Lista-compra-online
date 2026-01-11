import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'danger' | 'outline' | 'success'
}

export function Badge({ 
  className = '', 
  variant = 'default', 
  ...props 
}: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  
  const variants = {
    default: "border-transparent bg-primary text-white shadow hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-foreground hover:bg-secondary/80",
    danger: "border-transparent bg-danger text-white shadow hover:bg-danger/80",
    outline: "text-foreground border-border",
    success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  )
}
