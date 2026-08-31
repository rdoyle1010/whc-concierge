'use client'

import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'

export default function PropertyAddressLookup({
  postcode,
  address,
  mapUrl,
  onSelect,
}: {
  postcode: string
  address: string
  mapUrl: string
  onSelect: (values: { postcode: string; address: string; mapUrl: string }) => void
}) {
  const [query, setQuery] = useState(postcode || '')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; address: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function findAddresses() {
    const value = query.trim().toUpperCase()
    if (!value) return
    setLoading(true); setError(''); setSuggestions([])
    try {
      const res = await fetch(`/api/address-lookup?postcode=${encodeURIComponent(value)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.code === 'NOT_CONFIGURED'
          ? 'Postcode lookup needs its address-provider key adding in Netlify. You can still type the full address manually for now.'
          : (json.error || 'Could not find addresses for that postcode.'))
        return
      }
      setSuggestions(json.suggestions || [])
      if (!(json.suggestions || []).length) setError('No addresses found. Check the postcode and try again.')
    } catch {
      setError('Address lookup is temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }

  async function selectAddress(id: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/address-lookup?id=${encodeURIComponent(id)}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not load that address.'); return }
      const next = { postcode: json.postcode || query.toUpperCase(), address: json.address || '', mapUrl: json.mapUrl || '' }
      setQuery(next.postcode)
      onSelect(next)
      setSuggestions([])
    } catch {
      setError('Could not load that address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="md:col-span-2 border border-border bg-[#f5f6f8] p-4">
      <div className="flex items-center gap-2 mb-1"><MapPin size={15} className="text-ink"/><p className="text-[12px] font-semibold text-ink">Find the property address</p></div>
      <p className="text-[11px] text-muted mb-4">Enter the property postcode, then choose the correct address. Spa Platform creates the map link automatically.</p>

      <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
        <input className="input-field text-[13px] flex-1" value={query} onChange={e => setQuery(e.target.value.toUpperCase())} placeholder="e.g. BD20 5QG" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); findAddresses() } }} />
        <button type="button" onClick={findAddresses} disabled={loading} className="btn-primary px-5 py-2.5 text-[12px] disabled:opacity-50 inline-flex items-center justify-center gap-2"><Search size={14}/>{loading ? 'Finding...' : 'Find address'}</button>
      </div>

      {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}

      {suggestions.length > 0 && (
        <div className="mt-3 max-w-2xl border border-border bg-white divide-y divide-border">
          {suggestions.map(item => <button key={item.id} type="button" onClick={() => selectAddress(item.id)} className="block w-full px-4 py-3 text-left text-[12px] text-ink hover:bg-[#f5f6f8]">{item.address}</button>)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="md:col-span-2"><label className="block text-[11px] font-medium text-ink mb-1.5">Selected property address</label><textarea rows={2} className="input-field text-[13px] resize-y" value={address || ''} onChange={e => onSelect({ postcode: query, address: e.target.value, mapUrl: mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.target.value)}` })} placeholder="Full property address" /></div>
        {mapUrl && <div className="md:col-span-2"><a href={mapUrl} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-[#0b2f4d] underline">Open generated map link</a></div>}
      </div>
    </div>
  )
}
