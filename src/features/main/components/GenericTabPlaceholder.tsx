import { clsx } from 'clsx'
import { useWorkspaceTabs } from '@/features/main/context/WorkspaceTabsContext'

type GenericTabPlaceholderProps = {
  className?: string
}

export function GenericTabPlaceholder({ className }: GenericTabPlaceholderProps) {
  const { activeTabId, tabs } = useWorkspaceTabs()
  const tab = tabs.find((t) => t.id === activeTabId)

  if (!activeTabId || !tab) {
    return null
  }

  return (
    <div
      className={clsx(
        'flex min-h-[min(70vh,32rem)] flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm',
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-slate-900">{tab.label}</h2>
      <p className="mt-2 text-sm text-slate-500">
        เนื้อหาหน้านี้จะเชื่อมกับฟีเจอร์จริงในขั้นถัดไป (รหัสแท็บ:{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{tab.id}</code>)
      </p>
    </div>
  )
}
