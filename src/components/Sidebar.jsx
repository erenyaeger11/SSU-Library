import { BookOpen, LayoutDashboard, UsersRound, ScanLine, ClipboardList, ChartNoAxesCombined, Settings, LogOut, Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/students', label: 'Students', icon: UsersRound },
  { to: '/scan', label: 'Scan a student', icon: ScanLine, highlight: true },
  { to: '/visitors', label: 'Visitor logs', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user, onLogout, open, onClose }) {
  const visibleLinks = user?.must_change_password ? links.filter((link) => link.to === '/settings') : links
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={21} strokeWidth={1.8} /></div>
          <div><strong>SSU Library</strong><span>LIBRARY DESK</span></div>
          <button className="sidebar-close icon-button" onClick={onClose} aria-label="Close navigation"><X size={19} /></button>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav">
          {visibleLinks.map(({ to, label, icon: Icon, end, highlight }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''} ${highlight ? 'nav-scan' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{highlight && <span className="nav-new-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="online-indicator" /><div><strong>Library is open</strong><small>Ready to welcome readers</small></div></div>
          <div className="profile-row">
            <div className="profile-avatar">{(user?.name || 'Library Admin').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</div>
            <div className="profile-copy"><strong>{user?.name || 'Library Admin'}</strong><small>{user?.role || 'Library staff'}</small></div>
            <button className="logout-button" onClick={onLogout} title="Log out" aria-label="Log out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return <button className="mobile-menu icon-button" onClick={onClick} aria-label="Open navigation"><Menu size={21} /></button>
}
