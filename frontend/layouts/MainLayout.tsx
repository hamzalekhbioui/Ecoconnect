import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isAuthenticated,
  onLogin,
  onLogout,
  onNavigate,
  currentPage
}) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogin={onLogin}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentPage={currentPage}
      />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
};