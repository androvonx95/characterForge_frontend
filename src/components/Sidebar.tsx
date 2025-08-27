// components/Sidebar.tsx
import React from "react"
import { useSidebar } from "./SidebarProvider"
import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  Menu as MenuIcon
} from "lucide-react"
import "./sidebar.css" // Optional: for custom styling

const items = [
  { title: "Home", icon: <Home size={18} />, href: "#" },
  { title: "Inbox", icon: <Inbox size={18} />, href: "#" },
  { title: "Calendar", icon: <Calendar size={18} />, href: "#" },
  { title: "Search", icon: <Search size={18} />, href: "#" },
  { title: "Settings", icon: <Settings size={18} />, href: "#" },
]

export function Sidebar() {
  const { isOpen, toggle } = useSidebar()

  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        <button onClick={toggle} className="sidebar-toggle">
          <MenuIcon size={20} />
        </button>
        {isOpen && <h2 className="sidebar-title">App Name</h2>}
      </div>

      <nav className="sidebar-menu">
        {items.map(item => (
          <a href={item.href} key={item.title} className="sidebar-item">
            {item.icon}
            {isOpen && <span className="sidebar-label">{item.title}</span>}
          </a>
        ))}
      </nav>
    </aside>
  )
}
