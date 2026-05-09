import { useCallback, useEffect, useState } from 'react'
import App from './App'
import processManifest from './processManifest'

export type ProcessLauncherProps = {
  apiBase?: string
  title?: string
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProcessLauncher({
  apiBase,
  title = processManifest.name,
  defaultOpen = false,
  onOpenChange,
}: ProcessLauncherProps) {
  const [open, setOpen] = useState(defaultOpen)

  const changeOpen = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') changeOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [changeOpen, open])

  return (
    <section className="process-launcher">
      <div>
        <span>{processManifest.id}</span>
        <strong>{title}</strong>
      </div>
      <button type="button" onClick={() => changeOpen(true)}>
        Open panel
      </button>

      {open && (
        <div className="process-dialog" role="dialog" aria-modal="true" aria-label={title}>
          <button className="process-dialog__scrim" type="button" aria-label="Close" onClick={() => changeOpen(false)} />
          <section className="process-dialog__window">
            <header className="process-dialog__header">
              <div>
                <span>{processManifest.id}</span>
                <strong>{title}</strong>
              </div>
              <button type="button" onClick={() => changeOpen(false)}>
                Close
              </button>
            </header>
            <App mode="workflow" apiBase={apiBase} />
          </section>
        </div>
      )}
    </section>
  )
}

export default ProcessLauncher
