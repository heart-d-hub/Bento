const LS_KEY = 'bento.settings.claudeApiKey'

export function getClaudeApiKey(): string {
  try { return localStorage.getItem(LS_KEY) ?? '' } catch { return '' }
}

export function setClaudeApiKey(key: string): void {
  try { localStorage.setItem(LS_KEY, key.trim()) } catch { /* ignore */ }
}
