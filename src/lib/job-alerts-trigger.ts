import { getInternalApiSecret } from '@/lib/internal-request'

// Fire the job alerts for a role that has just gone live.
//
// This used to be an inline fetch in one place: the paid Stripe webhook. So a
// role published from an employer's included annual allowance sent no alerts,
// and neither did a role an administrator flipped live - which is what
// happens to every paid role from an employer who was approved AFTER paying,
// because the webhook writes those is_live false and the alert route refuses
// a role that is not live yet.
//
// The whole top of the talent funnel therefore reached almost nobody. One
// helper, called from every path that puts a role on the market.
//
// Best-effort by design: an alert that fails must never roll back a
// publication somebody has paid for.
export function triggerJobAlerts(jobId: string, origin: string) {
  if (!jobId) return
  try {
    const secret = getInternalApiSecret()
    if (!secret) return
    void fetch(new URL('/api/job-alerts', origin).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-whc-internal-secret': secret,
      },
      body: JSON.stringify({ jobId }),
    }).catch(() => { })
  } catch { }
}
