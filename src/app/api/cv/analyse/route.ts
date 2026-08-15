import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyseCvText } from '@/lib/cv-analysis'

export const runtime = 'nodejs'

const MAX_CV_SIZE = 10 * 1024 * 1024

async function extractText(buffer: Buffer, extension: string): Promise<string> {
  if (extension === 'pdf') {
    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
      CanvasFactory,
    })
    try {
      return (await parser.getText()).text
    } finally {
      await parser.destroy()
    }
  }
  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    return (await mammoth.extractRawText({ buffer })).value
  }
  throw new Error('Unsupported CV format')
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* read-only in route handlers */ },
        },
      }
    )
    const { data: { user } } = await auth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const profileId = typeof body.profileId === 'string' ? body.profileId : ''
    if (!profileId) return NextResponse.json({ error: 'Profile is required' }, { status: 400 })

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('candidate_profiles')
      .select('user_id, cv_url')
      .eq('id', profileId)
      .single()
    if (!profile || profile.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!profile.cv_url) return NextResponse.json({ error: 'Upload a CV first' }, { status: 400 })

    const fileUrl = new URL(profile.cv_url, 'https://whc.local')
    const bucket = fileUrl.searchParams.get('bucket')
    const path = fileUrl.searchParams.get('path')
    if (bucket !== 'talent-documents' || !path || !path.startsWith(`${user.id}/`) || path.includes('..')) {
      return NextResponse.json({ error: 'CV storage reference is invalid' }, { status: 400 })
    }

    const extension = path.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'docx'].includes(extension)) {
      return NextResponse.json({ error: 'For CV analysis, please use a PDF or modern Word .docx file.' }, { status: 400 })
    }

    const { data: file, error } = await admin.storage.from(bucket).download(path)
    if (error || !file) return NextResponse.json({ error: 'CV could not be read' }, { status: 500 })
    if (file.size > MAX_CV_SIZE) return NextResponse.json({ error: 'CV is too large to analyse' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, extension)
    if (text.trim().length < 80) {
      return NextResponse.json({ error: 'Very little readable text was found. If this is a scanned CV, upload a text-based PDF or Word .docx file.' }, { status: 422 })
    }

    // Raw CV text is deliberately neither returned, persisted nor logged.
    return NextResponse.json({ suggestions: analyseCvText(text) })
  } catch {
    // Parser and infrastructure errors may contain internal details, so expose
    // only a stable message to the browser.
    return NextResponse.json({ error: 'CV analysis failed. Please try a different PDF or Word .docx file.' }, { status: 500 })
  }
}
