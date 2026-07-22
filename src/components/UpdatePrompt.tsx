import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return <div role="status" className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl bg-coral p-4 font-semibold shadow-soft"><span>An app update is ready.</span><button onClick={() => updateServiceWorker(true)} className="rounded-full bg-ink px-4 py-2 text-white">Update</button></div>
}
