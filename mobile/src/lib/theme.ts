import { Platform } from 'react-native'

export const palette = {
  ink: '#172A34',
  inkStrong: '#10232D',
  text: '#253740',
  muted: '#6D7A80',
  quiet: '#8D979B',
  line: '#E2E6E4',
  lineStrong: '#D5DBD8',
  paper: '#FFFFFF',
  stone: '#F6F6F3',
  stoneDeep: '#EFEFEB',
  sage: '#68776C',
  sageSoft: '#F1F4F1',
  danger: '#A33A3A',
  dangerSoft: '#FBF4F3',
}

export const type = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
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
  medium: 8,
  large: 14,
}
