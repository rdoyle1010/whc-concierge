// Writing a row without knowing every column exists.
//
// This is not defensive programming for its own sake. It is the single most
// expensive bug this platform has had.
//
// Registration wrote `agreed_terms` to candidate_profiles. That column does
// not exist. Postgres does not ignore an unknown column and write the rest:
// it refuses the whole statement. So every talent registration failed at the
// last step, the person was told their profile could not be opened, and they
// left. The account, the auth user and the name on `profiles` all survived,
// which is why it read as three people who signed up and could not be
// bothered rather than three people we turned away at the door.
//
// The old registration route had this exact helper and never hit the problem.
// The new one was written without it, and the schema drifted underneath.
//
// Stripping is the right behaviour here because these writes are all
// best-effort enrichment around one required field. A row with a name and no
// `has_car` is a working account. No row at all is a lost professional.

export type TolerantUpsertResult =
  | { ok: true; stripped: string[] }
  | { ok: false; error: string; stripped: string[] }

/** The two shapes PostgREST and Postgres use to say "no such column". */
function unknownColumn(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/)
    || message.match(/column "([^"]+)" of relation/)
    || message.match(/column ([a-z_]+) of relation/)
  return match?.[1] || null
}

/**
 * Upsert, dropping any column the database does not have and trying again.
 *
 * Returns which columns were dropped, so the caller can log them. A column
 * silently disappearing from a write is how this bug hid for three days; a
 * column noisily disappearing is a schema drift somebody can fix.
 */
export async function tolerantUpsert(
  client: any,
  table: string,
  row: Record<string, any>,
  options: { onConflict: string; maxStrips?: number },
): Promise<TolerantUpsertResult> {
  const data = { ...row }
  const stripped: string[] = []
  const limit = options.maxStrips ?? 8

  for (let attempt = 0; attempt <= limit; attempt++) {
    const { error } = await client.from(table).upsert(data, { onConflict: options.onConflict })
    if (!error) return { ok: true, stripped }

    const column = unknownColumn(String(error.message || ''))
    // Only an unknown column is recoverable. A constraint violation, a
    // permission refusal or a dead connection is a real failure and must
    // reach the caller rather than being retried into a stripped-down row
    // nobody asked for.
    if (!column || !(column in data)) {
      return { ok: false, error: String(error.message || 'The row could not be written.'), stripped }
    }
    delete data[column]
    stripped.push(column)
  }

  return { ok: false, error: `Gave up after stripping ${limit} unknown columns.`, stripped }
}
