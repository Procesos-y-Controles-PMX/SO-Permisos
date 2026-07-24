import { SelectHTMLAttributes } from 'react'
import { FIELD_SELECT } from '@/components/ui/contentStyles'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
}

const CHEVRON =
  "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%2364748b%22%20stroke-width%3d%222%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]"

export default function Select({ label, options, placeholder, className = '', id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-fg-subtle"
        >
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className={`${FIELD_SELECT} ${CHEVRON} ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export type { SelectOption }
