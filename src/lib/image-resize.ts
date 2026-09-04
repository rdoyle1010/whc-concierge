import sharp from 'sharp'

// One implementation, shared by the upload route and the tool that reprocesses
// what is already in storage. Two copies of this would drift, and the day they
// did, pictures uploaded today and pictures fixed yesterday would stop matching.

// 2400px still looks sharp full-bleed on a retina display and is an order of
// magnitude less data than a modern camera roll.
export const MAX_IMAGE_WIDTH = 2400

// Rasterising an SVG throws away the point of it, and sharp would flatten an
// animated GIF into its first frame.
export const SKIP_RESIZE = new Set(['image/svg+xml', 'image/gif'])

export async function shrinkImage(buffer: Buffer, type: string): Promise<Buffer> {
  if (!type.startsWith('image/') || SKIP_RESIZE.has(type)) return buffer
  try {
    const image = sharp(buffer, { failOn: 'none' })
    const { width } = await image.metadata()
    // rotate() applies the EXIF orientation and drops the tag, so a photo
    // taken sideways on a phone is not served sideways.
    let pipeline = image.rotate()
    if (width && width > MAX_IMAGE_WIDTH) pipeline = pipeline.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    const out = type === 'image/png'
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    // Never hand back something larger than we were given.
    return out.length < buffer.length ? out : buffer
  } catch {
    // A picture sharp cannot read is still the person's picture. Store the
    // original rather than failing their upload over an optimisation.
    return buffer
  }
}
