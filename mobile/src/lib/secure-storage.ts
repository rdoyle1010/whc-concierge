import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Supabase session storage.
//
// Sessions used to sit in AsyncStorage, which on a rooted or jailbroken
// handset - or in any device backup - is plain text on disk. They now live in
// the iOS keychain / Android keystore via expo-secure-store.
//
// Two practicalities shape the adapter:
//   1. SecureStore refuses large values (the Android backend warns above
//      2048 bytes). A Supabase session is two JWTs plus the user record and
//      routinely passes that, so values are split into chunks and the head
//      key records how many there are.
//   2. Nobody may be signed out by the upgrade. The first read of a key that
//      is not in SecureStore yet falls back to the old AsyncStorage value,
//      writes it across, and deletes the plain-text copy. That happens once
//      per key: after the migration the AsyncStorage read returns null.
//
// SecureStore has no web implementation, so on web the adapter stays on
// AsyncStorage. Every secure call is also wrapped, so a device that refuses
// the keychain degrades to the old behaviour instead of locking the user out.

const CHUNK_SIZE = 1800
const CHUNK_MARKER = '__whc_chunked__:'
const SECURE_KEY_PATTERN = /[^A-Za-z0-9._-]/g

const useSecureStore = Platform.OS !== 'web'

// SecureStore keys accept alphanumerics, '.', '-' and '_' only. Supabase keys
// already qualify, but a sanitised form keeps any future key safe.
function secureKey(key: string): string {
  return key.replace(SECURE_KEY_PATTERN, '_')
}

function chunkKey(key: string, index: number): string {
  return `${secureKey(key)}.c${index}`
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    /* nothing stored under this key */
  }
}

// Removes the chunks a previous write left behind, so a shorter session never
// leaves a longer one's tail readable.
async function clearChunks(key: string): Promise<void> {
  const head = await secureGet(secureKey(key))
  if (!head || !head.startsWith(CHUNK_MARKER)) return
  const count = parseInt(head.slice(CHUNK_MARKER.length), 10) || 0
  for (let index = 0; index < count; index += 1) await secureDelete(chunkKey(key, index))
}

async function readSecure(key: string): Promise<string | null> {
  const head = await secureGet(secureKey(key))
  if (head === null) return null
  if (!head.startsWith(CHUNK_MARKER)) return head
  const count = parseInt(head.slice(CHUNK_MARKER.length), 10) || 0
  const parts: string[] = []
  for (let index = 0; index < count; index += 1) {
    const part = await secureGet(chunkKey(key, index))
    // A missing chunk means a half-written session: treat it as no session
    // rather than handing Supabase a truncated token.
    if (part === null) return null
    parts.push(part)
  }
  return parts.join('')
}

async function writeSecure(key: string, value: string): Promise<void> {
  await clearChunks(key)
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(secureKey(key), value)
    return
  }
  const parts: string[] = []
  for (let start = 0; start < value.length; start += CHUNK_SIZE) parts.push(value.slice(start, start + CHUNK_SIZE))
  for (let index = 0; index < parts.length; index += 1) await SecureStore.setItemAsync(chunkKey(key, index), parts[index])
  await SecureStore.setItemAsync(secureKey(key), `${CHUNK_MARKER}${parts.length}`)
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!useSecureStore) return AsyncStorage.getItem(key)
    const stored = await readSecure(key)
    if (stored !== null) return stored

    // Migration path: an existing signed-in user still has the session in
    // AsyncStorage. Move it into SecureStore and clear the plain-text copy.
    const legacy = await AsyncStorage.getItem(key).catch(() => null)
    if (legacy === null) return null
    try {
      await writeSecure(key, legacy)
      await AsyncStorage.removeItem(key)
    } catch {
      // The keychain refused the write. Keep the user signed in on the old
      // storage rather than logging them out.
      return legacy
    }
    return legacy
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!useSecureStore) {
      await AsyncStorage.setItem(key, value)
      return
    }
    try {
      await writeSecure(key, value)
      await AsyncStorage.removeItem(key).catch(() => undefined)
    } catch {
      await AsyncStorage.setItem(key, value)
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!useSecureStore) {
      await AsyncStorage.removeItem(key)
      return
    }
    await clearChunks(key)
    await secureDelete(secureKey(key))
    await AsyncStorage.removeItem(key).catch(() => undefined)
  },
}
