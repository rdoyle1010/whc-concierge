import { Platform } from 'react-native'

// The website's warm charcoal tokens, so the app and the site read as one
// product. Every value here is a colour the website already ships; nothing is
// invented. 'line' and 'lineStrong' share a value because the site has a
// single border tone (#e0dad2) rather than a light/strong pair.
export const palette = {
  ink: '#1C1B1A',
  inkStrong: '#0F0E0D',
  text: '#57534E',
  muted: '#6E6A66',
  quiet: '#8C8781',
  line: '#E0DAD2',
  lineStrong: '#E0DAD2',
  paper: '#FFFFFF',
  stone: '#F7F5F2',
  stoneDeep: '#F3F0EB',
  sage: '#57534E',
  sageSoft: '#E9E4DD',
  danger: '#A33A3A',
  dangerSoft: '#FBF4F3',
}

export const type = {
  // Closest dependable native equivalents to the website's
  // Cormorant Garamond + Manrope pairing, without bundling font files.
  serif: Platform.select({ ios: 'Baskerville', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' }),
}

export const space = {
  page: 22,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 40,
}

export const radius = {
  small: 4,
  medium: 7,
  large: 8,
}
