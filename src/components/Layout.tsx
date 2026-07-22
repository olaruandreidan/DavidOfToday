import { BarChart3, ClipboardPen, History, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useGameState } from '../state/GameStateContext'

export function Layout() {
  const { notice, dismissNotice } = useGameState()
  const links = [
    { to: '/dashboard', label: 'Today', icon: BarChart3 },
    { to: '/daily', label: 'Check in', icon: ClipboardPen },
    { to: '/history', label: 'History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings }
  ]
  return <div className="mx-auto min-h-screen max-w-5xl pb-24 md:pb-8">
    <header className="flex items-center justify-between px-5 py-5 md:px-8">
      <NavLink to="/dashboard" className="font-display text-xl font-bold tracking-tight">David of Today</NavLink>
      <span className="rounded-full bg-mint/30 px-3 py-1 text-xs font-bold">Private on this device</span>
    </header>
    {notice && <div role="status" className="mx-5 mb-4 flex items-start justify-between gap-4 rounded-2xl bg-ink p-4 text-sm text-white md:mx-8"><span>{notice}</span><button onClick={dismissNotice} className="underline">Dismiss</button></div>}
    <main className="px-5 md:px-8"><Outlet /></main>
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink px-3 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 text-white md:static md:mx-8 md:mt-10 md:rounded-3xl md:border-0">
      <ul className="mx-auto grid max-w-xl grid-cols-4 gap-1">{links.map(({ to, label, icon: Icon }) => <li key={to}><NavLink to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold ${isActive ? 'bg-white text-ink' : 'text-white/65 hover:text-white'}`}><Icon size={20} aria-hidden="true" />{label}</NavLink></li>)}</ul>
    </nav>
  </div>
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <header className="mb-7 max-w-2xl"><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">{title}</h1>{children && <div className="mt-3 text-ink/65">{children}</div>}</header>
}
