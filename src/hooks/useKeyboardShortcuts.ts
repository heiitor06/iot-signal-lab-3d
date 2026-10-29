import { useEffect, useRef } from 'react'

export type ShortcutMap = Partial<Record<'Space' | 'ArrowRight' | 'KeyR' | 'PageDown' | 'PageUp', () => void>>

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  // Botões e campos já tratam Espaço/Enter por conta própria.
  return target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)
}

/** Atalhos globais para a apresentação. Ignorados enquanto o foco está num controle. */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const ref = useRef(shortcuts)

  useEffect(() => {
    ref.current = shortcuts
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return
      const action = ref.current[event.code as keyof ShortcutMap]
      if (!action) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
