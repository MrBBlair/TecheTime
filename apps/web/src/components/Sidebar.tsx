import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import BusinessSwitcher from './BusinessSwitcher';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle, onClose }: SidebarProps) {
  const { user, userData, logout, businesses, selectedBusinessId, setSelectedBusinessId, business } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    window.location.href = '/';
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/time-clock', label: 'Time Clock', icon: '⏰' },
    { to: '/payroll', label: 'Payroll', icon: '💰' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const adminLinks = [
    { to: '/admin-settings', label: 'Admin Settings', icon: '🔧' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const showAdminLinks = userData?.role === 'OWNER' || userData?.role === 'MANAGER' || userData?.role === 'SUPERADMIN';

  if (!user) return null;

  const sidebarContent = (
    <div className={`h-full flex flex-col bg-royal-purple text-old-gold transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-old-gold/30">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple rounded shrink-0" aria-label="Tech eTime Home" onClick={onClose}>
            <Logo variant="header" priority />
            <span className="text-base font-bold whitespace-nowrap">Tech eTime</span>
          </Link>
        )}
        {isCollapsed && (
          <Link to="/dashboard" className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple rounded" aria-label="Tech eTime Home" onClick={onClose}>
            <Logo variant="header" priority />
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-old-gold/10 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple text-old-gold shrink-0"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            {isCollapsed ? <path d="M9 5l7 7-7 7" /> : <path d="M15 19l-7-7 7-7" />}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4" role="navigation" aria-label="Main navigation">
        <div className="px-2 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple ${
                isActive(link.to) ? 'bg-old-gold text-charcoal font-semibold' : 'text-old-gold hover:bg-old-gold/10'
              } ${isCollapsed ? 'justify-center' : ''}`}
              aria-current={isActive(link.to) ? 'page' : undefined}
              title={isCollapsed ? link.label : undefined}
            >
              <span className="text-xl shrink-0" aria-hidden="true">{link.icon}</span>
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{link.label}</span>}
            </Link>
          ))}
          {showAdminLinks && adminLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple ${
                isActive(link.to) ? 'bg-old-gold text-charcoal font-semibold' : 'text-old-gold hover:bg-old-gold/10'
              } ${isCollapsed ? 'justify-center' : ''}`}
              aria-current={isActive(link.to) ? 'page' : undefined}
              title={isCollapsed ? link.label : undefined}
            >
              <span className="text-xl shrink-0" aria-hidden="true">{link.icon}</span>
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{link.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-old-gold/30 p-4 space-y-3">
        {!isCollapsed && (
          <div className="px-2">
            <BusinessSwitcher />
          </div>
        )}
        {isCollapsed && businesses && businesses.length > 1 && (
          <div className="flex justify-center px-2" title={business?.name || 'Select Business'}>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => {
                if (e.target.value && setSelectedBusinessId) {
                  setSelectedBusinessId(e.target.value);
                  window.dispatchEvent(new CustomEvent('businessChanged', { detail: { businessId: e.target.value } }));
                }
              }}
              className="bg-old-gold/10 text-old-gold border border-old-gold/30 rounded-lg px-2 py-1 text-xs font-medium hover:bg-old-gold/20 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple transition-colors cursor-pointer w-full"
              aria-label="Select business"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id} className="bg-white text-charcoal">
                  {b.name.length > 10 ? b.name.substring(0, 10) + '...' : b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleLogout}
          onKeyDown={(e) => handleKeyDown(e, handleLogout)}
          className={`w-full bg-old-gold text-charcoal px-3 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple ${isCollapsed ? 'px-2' : ''}`}
          aria-label="Logout"
          title={isCollapsed ? 'Logout' : undefined}
        >
          {isCollapsed ? '🚪' : 'Logout'}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {!isCollapsed && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onToggle} aria-hidden="true" />
        )}
        <aside
          className={`fixed left-0 top-0 h-full z-50 md:hidden transition-transform duration-300 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}`}
          role="complementary"
          aria-label="Navigation sidebar"
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-0 h-full z-30 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
      role="complementary"
      aria-label="Navigation sidebar"
    >
      {sidebarContent}
    </aside>
  );
}
