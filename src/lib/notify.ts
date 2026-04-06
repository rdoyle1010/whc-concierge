/** Client-side notification helper — calls the server to create notifications */
export async function notify(userId: string, type: string, title: string, message: string, link?: string) {
  await fetch('/api/notifications/create', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, title, message, link }),
  })
}
