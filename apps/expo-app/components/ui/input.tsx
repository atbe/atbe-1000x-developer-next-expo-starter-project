import React from 'react'
import { TextInput, type TextInputProps, type View } from 'react-native'
import { cn } from '../../lib/utils'

export interface InputProps extends TextInputProps {
  className?: string
}

export const Input = React.forwardRef<View, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground',
          className
        )}
        placeholderTextColor="#a1a1aa"
        ref={ref as any}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'