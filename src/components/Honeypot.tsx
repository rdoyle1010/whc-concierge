'use client'

// A field a person never sees or reaches with the keyboard. Bots that fill in
// every input fill this one too, and the server turns them away. Named so that
// browser autofill leaves it alone (a "company" field would get a real company
// name and turn a genuine employer away). Send its value
// as `company`.
export default function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input type="text" name="thc_hp" value={value} onChange={event => onChange(event.target.value)}
      tabIndex={-1} autoComplete="off" aria-hidden="true"
      className="absolute left-[-9999px] h-0 w-0 opacity-0" />
  )
}
