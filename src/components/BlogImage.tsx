'use client'

import { useState } from 'react'

/**
 * Blog image with graceful fallback. If the source is missing or fails to
 * load (e.g. a deleted or 404 image URL), it falls back to a neutral
 * placeholder block instead of showing a broken-image icon.
 */
export default function BlogImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    return <div className="w-full h-full bg-neutral-100" />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
