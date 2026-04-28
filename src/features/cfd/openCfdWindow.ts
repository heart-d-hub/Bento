import { isTauri } from '@/features/desktop/isTauri'

export async function openCfdWindow(): Promise<void> {
  if (!isTauri()) {
    window.open(window.location.origin + '/?cfd=1', '_blank', 'width=1280,height=720')
    return
  }

  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('show_cfd_window')
}
