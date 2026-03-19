import * as React from "react"

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
