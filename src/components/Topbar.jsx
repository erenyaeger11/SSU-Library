import { Bell, ChevronDown, Search } from 'lucide-react'
import { MobileMenuButton } from './Sidebar'

export default function Topbar({ title, eyebrow, onMenu, user }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <MobileMenuButton onClick={onMenu} />
        <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <div className="top-search"><Search size={16} /><span>Library desk</span><kbd>⌘ K</kbd></div>
        <button className="top-icon-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <div className="top-user"><div className="profile-avatar">{(user?.name || 'L').slice(0, 1).toUpperCase()}</div><ChevronDown size={15} /></div>
      </div>
    </header>
  )
}
