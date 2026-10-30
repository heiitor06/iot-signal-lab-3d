import { useId } from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  label: string
  /** null quando o valor atual não corresponde a nenhuma opção (ex.: valor personalizado). */
  value: T | null
  options: readonly SegmentOption<T>[]
  onChange: (value: T) => void
}

/** Grupo de opções exclusivas, implementado com rádios nativos (teclado e leitor de tela de graça). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm text-ink-2">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface-2 p-1">
        {options.map((option) => {
          const checked = option.value === value
          return (
            <label
              key={option.value}
              className={`relative flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-md px-2.5 text-sm whitespace-nowrap transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
                checked ? 'bg-surface-3 font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.25)]' : 'text-ink-3 hover:text-ink'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
