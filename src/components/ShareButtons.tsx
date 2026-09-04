'use client'

import { useState } from 'react'
import { Linkedin, Facebook, MessageCircle, Mail, Link2, Check } from 'lucide-react'

interface ShareButtonsProps {
  url: string
  title: string
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedMessage = encodeURIComponent(`${title} ${url}`)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const links = [
    { name: 'LinkedIn', icon: <Linkedin size={15}/>, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'Facebook', icon: <Facebook size={15}/>, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: 'WhatsApp', icon: <MessageCircle size={15}/>, href: `https://wa.me/?text=${encodedMessage}` },
    { name: 'Email', icon: <Mail size={15}/>, href: `mailto:?subject=${encodedTitle}&body=${encodedMessage}` },
  ]

  return <div className="flex flex-wrap items-center gap-2">
    {links.map(link => <a key={link.name} href={link.href} target={link.name === 'Email' ? undefined : '_blank'} rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-[11px] font-semibold text-[#1c1c1c] hover:bg-[#f1f1f1]" title={`Share on ${link.name}`}>{link.icon}{link.name}</a>)}
    <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-2 rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-[11px] font-semibold text-[#1c1c1c] hover:bg-[#f1f1f1]" title="Copy article link">
      {copied ? <Check size={15}/> : <Link2 size={15}/>} {copied ? 'Copied' : 'Copy link'}
    </button>
  </div>
}
