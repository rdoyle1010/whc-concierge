'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: 'in',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      external: true,
    },
    {
      name: 'X',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      external: true,
    },
    {
      name: 'WhatsApp',
      icon: 'wa',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      external: true,
    },
  ];

  return (
    <div className="flex flex-row items-center gap-2">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted text-xs hover:text-ink transition-colors duration-150"
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}

      <button
        onClick={handleCopyLink}
        className="text-muted text-xs hover:text-ink transition-colors duration-150 relative"
        title="Copy link to clipboard"
      >
        {copied ? (
          <>
            <span className="inline-block">✓</span>
            <span className="absolute top-full mt-1 right-0 bg-ink text-background px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none">
              Copied!
            </span>
          </>
        ) : (
          '🔗'
        )}
      </button>
    </div>
  );
}
