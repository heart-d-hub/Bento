import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null; info: ErrorInfo | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      const e = this.state.error
      const isDev = import.meta.env.DEV
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-rose-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-rose-900">เกิดข้อผิดพลาดในโปรแกรม</h1>
          <p className="max-w-lg text-sm text-rose-800">
            โปรดรีเฟรชหน้าหรือเปิดแอปใหม่ ถ้ายังเกิดซ้ำ แจ้งผู้ดูแลพร้อมข้อความด้านล่าง
          </p>
          <pre className="max-h-[40vh] max-w-full overflow-auto rounded-lg border border-rose-200 bg-white p-3 text-left text-xs text-slate-800">
            {e.name}: {e.message}
            {isDev && e.stack ? `\n\n${e.stack}` : ''}
            {isDev && this.state.info?.componentStack
              ? `\n\n${this.state.info.componentStack}`
              : ''}
          </pre>
          <button
            type="button"
            className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
            onClick={() => window.location.reload()}
          >
            รีเฟรชหน้า
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
