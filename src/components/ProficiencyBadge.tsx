const STYLES: Record<string, string> = {
  master: 'text-white text-[10px] font-semibold px-2 py-0.5 rounded-full',
  advanced: 'text-white text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink',
  intermediate: 'text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-ink',
  beginner: 'text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-border text-muted',
}

const LABELS: Record<string, string> = {
  master: 'Master', advanced: 'Advanced', intermediate: 'Intermediate', beginner: 'Beginner',
  expert: 'Master', competent: 'Intermediate', basic: 'Beginner',
}

export default function ProficiencyBadge({ level }: { level: string }) {
  const normalized = level?.toLowerCase() || 'beginner'
  const mapped = normalized === 'expert' ? 'master' : normalized === 'competent' ? 'intermediate' : normalized === 'basic' ? 'beginner' : normalized
  return (
    <span className={STYLES[mapped] || STYLES.beginner} style={mapped === 'master' ? { backgroundColor: '#C9A96E' } : undefined}>
      {LABELS[normalized] || level}
    </span>
  )
}
