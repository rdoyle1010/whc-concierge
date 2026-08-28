import { Platform } from 'react-native'

export const palette = {
  ink: '#0B2F4D',
  inkStrong: '#10283B',
  text: '#263746',
  muted: '#65717A',
  quiet: '#7F8A91',
  line: '#DFE5E8',
  lineStrong: '#CBD4D9',
  paper: '#FFFFFF',
  stone: '#F7F9FA',
  stoneDeep: '#F0F3F5',
  sage: '#6F7F88',
  sageSoft: '#F3F6F7',
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
