import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import { secureSessionStorage } from './secure-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase mobile environment configuration')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Access and refresh tokens live in the device keychain, not in
    // plain-text AsyncStorage. Existing sessions migrate across on first read.
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
