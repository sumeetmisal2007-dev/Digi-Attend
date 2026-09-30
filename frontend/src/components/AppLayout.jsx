import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout({ navItems }) {
  return (
    <div className="app-shell">
      <Sidebar navItems={navItems} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
