export const colors = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  background: '#f3f0eb',
  gold: '#1c1b1a',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  cardBg: '#FFFFFF',
  border: '#e0dad2',
  muted: '#8c8781',
  sidebar: '#0A0A0A',
}

export const matchColors = {
  perfect: { bg: '#DCFCE7', text: '#16A34A', label: 'Perfect Match' },
  strong: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Strong Match' },
  good: { bg: '#FEF3C7', text: '#D97706', label: 'Good Match' },
  partial: { bg: '#F3F4F6', text: '#57534e', label: 'Partial Match' },
}

export function getMatchStyle(score: number) {
  if (score >= 90) return matchColors.perfect
  if (score >= 75) return matchColors.strong
  if (score >= 60) return matchColors.good
  return matchColors.partial
}
