import { createClient } from 'npm:@supabase/supabase-js@2'

type EventBody = { eventType?: 'new_message' | 'job_application'; recordId?: string }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return json({ error: 'Unauthorised' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
  const publishableKey = publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY') || ''
  const secretKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

  const userClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const admin = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: { user }, error: userError } = await userClient.auth.getUser(token)
  if (userError || !user) return json({ error: 'Unauthorised' }, 401)

  const body = await req.json().catch(() => ({})) as EventBody
  if (!body.eventType || !body.recordId) return json({ error: 'eventType and recordId are required' }, 400)

  let recipientId = ''
  let title = ''
  let message = ''
  let link = '/notifications'

  if (body.eventType === 'new_message') {
    const { data: row, error } = await admin.from('messages').select('id,sender_id,recipient_id,content').eq('id', body.recordId).maybeSingle()
    if (error || !row) return json({ error: 'Message not found' }, 404)
    if (row.sender_id !== user.id) return json({ error: 'Forbidden' }, 403)

    const { data: sender } = await admin.from('profiles').select('full_name,email').eq('id', user.id).maybeSingle()
    recipientId = row.recipient_id
    title = `New message from ${sender?.full_name || sender?.email || 'Wellness House'}`
    message = String(row.content || '').slice(0, 160)
    link = `/message/${user.id}`
  }

  if (body.eventType === 'job_application') {
    const { data: application, error } = await admin.from('applications').select('id,candidate_id,role_id,job_id').eq('id', body.recordId).maybeSingle()
    if (error || !application) return json({ error: 'Application not found' }, 404)

    const { data: candidate } = await admin.from('candidate_profiles').select('user_id,full_name').eq('id', application.candidate_id).maybeSingle()
    if (!candidate || candidate.user_id !== user.id) return json({ error: 'Forbidden' }, 403)

    const jobId = application.role_id || application.job_id
    const { data: job } = await admin.from('job_listings').select('job_title,employer_id').eq('id', jobId).maybeSingle()
    if (!job?.employer_id) return json({ error: 'Job not found' }, 404)

    const { data: employer } = await admin.from('employer_profiles').select('user_id').eq('id', job.employer_id).maybeSingle()
    if (!employer?.user_id) return json({ error: 'Employer not found' }, 404)

    recipientId = employer.user_id
    title = 'New job application'
    message = `${candidate.full_name || 'A candidate'} applied for ${job.job_title || 'your role'}.`
    link = '/applications'
  }

  if (!recipientId) return json({ error: 'Unsupported event' }, 400)

  await admin.from('notifications').insert({ user_id: recipientId, type: body.eventType === 'new_message' ? 'new_message' : 'job_application', title, message, link, is_read: false })

  const { data: tokens } = await admin.from('mobile_push_tokens').select('id,expo_push_token').eq('user_id', recipientId).eq('is_active', true)
  if (!tokens?.length) return json({ ok: true, pushed: 0 })

  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')
  if (expoAccessToken) headers.Authorization = `Bearer ${expoAccessToken}`

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(tokens.map((row) => ({ to: row.expo_push_token, sound: 'default', title, body: message, data: { link } }))),
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) return json({ ok: true, pushed: 0, pushError: result })

  const tickets = Array.isArray(result?.data) ? result.data : []
  const invalidIds = tokens.filter((row, index) => tickets[index]?.status === 'error' && tickets[index]?.details?.error === 'DeviceNotRegistered').map(row => row.id)
  if (invalidIds.length) await admin.from('mobile_push_tokens').update({ is_active: false, updated_at: new Date().toISOString() }).in('id', invalidIds)

  return json({ ok: true, pushed: tokens.length - invalidIds.length })
})
