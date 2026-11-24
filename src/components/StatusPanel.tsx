import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function StatusPanel({ icon: Icon, title, children, action }: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="status-panel">
      <div className="status-icon"><Icon size={26} aria-hidden="true" /></div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  )
}
