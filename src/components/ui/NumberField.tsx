import { memo, useId, useState } from 'react'
import type { Range } from '../../types/simulation'
import { formatPlainNumber } from '../../lib/format'

interface NumberFieldProps {
  label: string
  name: string
  value: number
  range: Range
  unit?: string
  /** Mostra o slider junto do campo numérico. */
  slider?: boolean
  hint?: string
  validate: (value: number) => string | null
  onCommit: (value: number) => void
}

function parseLocaleNumber(text: string): number {
  const normalized = text.trim().replace(/\s/g, '').replace(',', '.')
  return normalized === '' ? Number.NaN : Number(normalized)
}

/**
 * Slider + campo numérico. O slider só produz valores válidos; o campo aceita
 * digitação livre (vírgula ou ponto) e só confirma o valor se ele passar
 * na validação. Enquanto inválido, o erro fica visível e a simulação não muda.
 */
export const NumberField = memo(function NumberField({
  label,
  name,
  value,
  range,
  unit,
  slider = true,
  hint,
  validate,
  onCommit,
}: NumberFieldProps) {
  const id = useId()
  const [text, setText] = useState(() => formatPlainNumber(value, 4))
  const [error, setError] = useState<string | null>(null)
  const [syncedValue, setSyncedValue] = useState(value)

  // O valor mudou por fora (slider, preset): o texto acompanha, durante o render.
  if (value !== syncedValue) {
    setSyncedValue(value)
    setText(formatPlainNumber(value, 4))
    setError(null)
  }

  const commitText = () => {
    const parsed = parseLocaleNumber(text)
    const message = validate(parsed)
    setError(message)
    if (message === null && parsed !== value) onCommit(parsed)
  }

  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-input`} className="text-sm text-ink-2">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id={`${id}-input`}
            name={name}
            type="text"
            autoComplete="off"
            spellCheck={false}
            inputMode="decimal"
            value={text}
            aria-invalid={error !== null}
            aria-describedby={describedBy}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText()
              if (e.key === 'Escape') {
                setText(formatPlainNumber(value, 4))
                setError(null)
              }
            }}
            className={`tabular h-9 w-24 rounded-md border bg-surface-2 px-2 text-right text-sm text-ink transition-colors focus-visible:border-ink ${
              error ? 'border-danger' : 'border-line hover:border-line-strong'
            }`}
          />
          {unit ? <span className="w-8 text-xs text-ink-3">{unit}</span> : null}
        </div>
      </div>
      {slider ? (
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={Math.min(range.max, Math.max(range.min, value))}
          aria-label={label}
          onChange={(e) => onCommit(Number(e.target.value))}
          className="h-6 w-full cursor-pointer"
        />
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
})
