import { useState } from 'react'
import { ManualIcon } from '@/features/manual/components/ManualIcon'
import { getManualScreenshotSrc } from '@/features/manual/lib/manualContent'

interface ManualImageProps {
  screenshot: string | null
  alt: string
}

export function ManualImage({ screenshot, alt }: ManualImageProps) {
  const [hasError, setHasError] = useState(false)
  const src = getManualScreenshotSrc(screenshot)

  if (!src || hasError) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
        <div className="space-y-2">
          <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white text-[var(--brand-600)]">
            <ManualIcon name="BookOpen" className="size-5" />
          </span>
          <p className="font-medium text-[var(--text-strong)]">Captura pendiente</p>
          <p className="max-w-xs text-xs leading-5">
            Este paso todavía no tiene una imagen cargada o la captura no está disponible.
          </p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-auto w-full rounded-2xl border border-[var(--border-soft)] bg-white object-cover shadow-[0_18px_42px_-28px_rgba(10,29,64,0.42)]"
      onError={() => setHasError(true)}
    />
  )
}
