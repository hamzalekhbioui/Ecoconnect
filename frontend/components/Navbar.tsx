import React, { useState } from 'react';
import { LogOut, User, X, Menu } from 'lucide-react';

interface NavbarProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogin, onLogout, onNavigate, currentPage }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { key: 'landing', label: 'Accueil' },
    { key: 'ai-concierge', label: 'AI Concierge' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'communities', label: 'Communities' },
  ];

  const handleNavClick = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('ai-concierge')}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#13ec5b]">
              <span className="material-symbols-outlined icon-filled text-[18px] text-gray-900">eco</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Symbiosis</h1>
          </div>

          {/* Desktop Nav - Pill Style */}
          <nav className="hidden md:flex items-center bg-gray-100 rounded-full p-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${currentPage === item.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${currentPage === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Dashboard
              </button>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 h-9 px-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-500 overflow-hidden flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">Account</span>
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => {
                          onNavigate('dashboard');
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </button>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => {
                          onLogout();
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Sign In
              </button>
            )}
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Slide-out Menu */}
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 md:hidden animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Close mobile menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentPage === item.key
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {item.label}
                </button>
              ))}
              {isAuthenticated && (
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentPage === 'dashboard'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Dashboard
                </button>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    onLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};