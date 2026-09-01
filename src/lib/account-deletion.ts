// Shared wording for the account-deletion confirmation shown to the person
// after /api/account/delete returns. Kept in one place so talent and employer
// settings say exactly the same thing about what was kept and why.

export type AccountDeletionResult = {
  message?: string
  filesRemoved?: number
  retained?: { note?: string; records?: string[] } | null
  incomplete?: string[] | null
}

export function deletionSummary(result: AccountDeletionResult): string {
  const lines: string[] = [result.message || 'Your account has been deleted.']

  if (typeof result.filesRemoved === 'number' && result.filesRemoved > 0) {
    lines.push('', `${result.filesRemoved} uploaded ${result.filesRemoved === 1 ? 'file was' : 'files were'} deleted from storage, including any CV, insurance certificate and right-to-work document.`)
  }

  if (result.retained?.records?.length) {
    lines.push('', result.retained.note || 'Some records were anonymised rather than deleted.')
    for (const record of result.retained.records) lines.push(`- ${record}`)
  }

  if (result.incomplete?.length) {
    lines.push('', 'These items could not be removed automatically and have been logged for WHC to finish by hand:')
    for (const item of result.incomplete) lines.push(`- ${item}`)
  }

  return lines.join('\n')
}
