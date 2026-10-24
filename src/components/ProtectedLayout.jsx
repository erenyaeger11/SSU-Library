import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const headings = {
  '/': ['YOUR LIBRARY, AT A GLANCE', 'Good morning'],
  '/students': ['LIBRARY DIRECTORY', 'Students'],
  '/scan': ['QUICK CHECK-IN', 'Scan a student'],
  '/visitors': ['VISIT HISTORY', 'Visitor logs'],
  '/reports': ['INSIGHTS & TRENDS', 'Reports'],
  '/settings': ['PREFERENCES', 'Settings'],
}

export default function ProtectedLayout({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [eyebrow, title] = headings[location.pathname] || headings['/']
  if (user?.must_change_password && location.pathname !== '/settings') {
    return <Navigate to="/settings" replace />
  }
  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area">
        <Topbar title={title} eyebrow={eyebrow} user={user} onMenu={() => setMenuOpen(true)} />
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer"><span>Made for curious minds.</span><span>SSU Library · Staff portal</span></footer>
      </div>
    </div>
  )
}
