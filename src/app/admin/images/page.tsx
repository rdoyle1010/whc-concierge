import { redirect } from 'next/navigation'

// Legacy image records are retained as a rollback source, but image editing
// now lives in Website & Brand so admins have one clear place to work.
export default function LegacyImagesRedirect() {
  redirect('/admin/website')
}
