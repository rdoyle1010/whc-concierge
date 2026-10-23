import { Platform } from 'react-native'

// The website's live tokens: ivory, stone and charcoal, and no metal
// (the site's own commit 2e4ac48e). Every value here is one the website ships.
// Severity follows the site's ink/edge/wash triples rather than gold.
export const palette = {
  // Forest carries anything you press or follow; charcoal anything you read.
  // The accent is deliberately never equal to the ink.
  accent: '#28322B',
  accentStrong: '#3A4239',
  ink: '#222321',
  inkStrong: '#161814',
  text: '#57544C',
  muted: '#6E6A60',
  quiet: '#7E7A70',
  line: '#DCD4C8',
  lineStrong: '#C7BDAE',
  paper: '#FFFFFF',
  stone: '#F6F3ED',
  stoneDeep: '#EDE8DF',
  sage: '#57544C',
  sageSoft: '#E3DCD1',
  danger: '#8A1C14',
  dangerSoft: '#FBE9E7',
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
