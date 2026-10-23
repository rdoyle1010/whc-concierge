import { doorsClosedFor } from '@/lib/platform-access'
import DoorsClosed from '@/components/DoorsClosed'

// Registration is gated in the layout, not the page: refusing to render the
// children is the only version a typed URL cannot walk past.
export default async function RegisterGate({ children }: { children: React.ReactNode }) {
  if (await doorsClosedFor()) return <DoorsClosed audience="both" />
  return children
}
