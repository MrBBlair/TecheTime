import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import Footer from './Footer';
import FloatingBackground from './FloatingBackground';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    setSidebarCollapsed(!newState);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {user && (
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onClose={closeMobileMenu}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {user && (
          <header className="bg-royal-purple text-old-gold shadow-md sticky top-0 z-20 h-16 md:h-20" role="banner">
            <div className="h-full px-4 flex items-center justify-between">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md hover:bg-old-gold/10 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple shrink-0 text-old-gold"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
              <div className="hidden md:block">
                {sidebarCollapsed && (
                  <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple rounded shrink-0" aria-label="Tech eTime Home">
                    <Logo variant="header" priority />
                    <span className="text-base font-bold whitespace-nowrap">Tech eTime</span>
                  </Link>
                )}
              </div>
              <div className="md:hidden">
                <Link to="/dashboard" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-old-gold focus:ring-offset-2 focus:ring-offset-royal-purple rounded shrink-0" aria-label="Tech eTime Home" onClick={closeMobileMenu}>
                  <Logo variant="header" priority />
                  <span className="text-sm font-bold whitespace-nowrap">Tech eTime</span>
                </Link>
              </div>
              <div className="flex-1" />
            </div>
          </header>
        )}

        <main
          id="main-content"
          className={`flex-1 relative overflow-hidden transition-all duration-300 ${user ? (sidebarCollapsed ? 'md:ml-16' : 'md:ml-64') : ''}`}
          role="main"
          tabIndex={-1}
        >
          <div className="absolute inset-0 bg-white overflow-hidden" aria-hidden>
            <div className="relative w-full h-full">
              <FloatingBackground />
            </div>
          </div>
          <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
