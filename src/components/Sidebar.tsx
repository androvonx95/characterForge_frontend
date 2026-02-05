// components/Sidebar.tsx
import { useSidebar } from "./SidebarProvider"
import {
  Home,
  MessageSquare,
  Settings,
  Menu as MenuIcon
} from "lucide-react"
import "../styles/sidebar.css" // Optional: for custom styling

interface SidebarProps {
  onNavigate?: (page: 'dashboard' | 'my-chats' | 'conversation', conversationId?: string) => void;
  currentPage?: 'dashboard' | 'my-chats' | 'conversation';
}

export function Sidebar({ onNavigate, currentPage }: SidebarProps) {
  const { isOpen, toggle } = useSidebar()

  const handleNavigation = (page: 'dashboard' | 'my-chats') => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const items = [
    { 
      title: "Dashboard", 
      icon: <Home size={18} />, 
      onClick: () => handleNavigation('dashboard'),
      isActive: currentPage === 'dashboard'
    },
    { 
      title: "My Chats", 
      icon: <MessageSquare size={18} />, 
      onClick: () => handleNavigation('my-chats'),
      isActive: currentPage === 'my-chats'
    },
    { 
      title: "Settings", 
      icon: <Settings size={18} />, 
      onClick: () => {/* Add settings functionality later */},
      isActive: false
    },
  ];

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
          <button 
            key={item.title} 
            className={`sidebar-item ${item.isActive ? 'active' : ''}`}
            onClick={item.onClick}
            type="button"
          >
            {item.icon}
            {isOpen && <span className="sidebar-label">{item.title}</span>}
          </button>
        ))}
      </nav>
    </aside>
  )
}