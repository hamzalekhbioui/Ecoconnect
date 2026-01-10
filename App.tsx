import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './frontend/context/AuthContext';
import { useAuth } from './frontend/hooks/useAuth';
import { ErrorBoundary } from './frontend/components/ErrorBoundary';
import { MainLayout } from './frontend/layouts/MainLayout';
import { LandingView } from './frontend/features/landing-page/components/LandingView';
import { MarketplaceView } from './frontend/features/marketplace/components/MarketplaceView';
import { DashboardView } from './frontend/features/dashboard/components/DashboardView';
import { CommunitiesLandingView } from './frontend/features/community/components/CommunitiesLandingView';
import { CommunityDetailView } from './frontend/features/community/components/CommunityDetailView';
import { SubCommunityDashboard } from './frontend/features/community/components/SubCommunityDashboard';
import { MyCommunitiesView } from './frontend/features/community/components/MyCommunitiesView';
import { MessagingView } from './frontend/features/messaging/components/MessagingView';
import { AccueilView } from './frontend/features/ai-assistant/components/AccueilView';
import { AIConciergeView } from './frontend/features/ai-assistant/components/AIConciergeView';
import { LoginPage } from './frontend/features/auth/components/LoginPage';
import { SignUpPage } from './frontend/features/auth/components/SignUpPage';

// Admin Portal imports
import { AdminLoginPage } from './frontend/features/admin/components/AdminLoginPage';
import { AdminLayout } from './frontend/features/admin/components/AdminLayout';
import { AdminGuard } from './frontend/features/admin/components/AdminGuard';
import { AdminDashboardView } from './frontend/features/admin/components/AdminDashboardView';
import { UserManagementView } from './frontend/features/admin/components/UserManagementView';
import { ResourceManagementView } from './frontend/features/admin/components/ResourceManagementView';
import { EventManagementView } from './frontend/features/admin/components/EventManagementView';
import { AdminMarketplaceView } from './frontend/features/admin/components/AdminMarketplaceView';
import { AdminCommunitiesView } from './frontend/features/admin/components/AdminCommunitiesView';
import { AdminReportsView } from './frontend/features/admin/components/AdminReportsView';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected route for authenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Main layout wrapper component
const MainLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => navigate('/login');
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  const handleNavigate = (page: string) => {
    // Convert old page names to routes
    const routeMap: Record<string, string> = {
      'home': '/',
      'landing': '/',
      'login': '/login',
      'signup': '/signup',
      'marketplace': '/marketplace',
      'dashboard': '/dashboard',
      'communities': '/communities',
      'ai-concierge': '/ai-concierge',
      'accueil': '/accueil',
      'messaging': '/messaging',
    };
    navigate(routeMap[page] || `/${page}`);
  };

  // Get current page name from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'landing';
    return path.slice(1); // Remove leading slash
  };

  return (
    <MainLayout
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      currentPage={getCurrentPage()}
    >
      {children}
    </MainLayout>
  );
};

// Admin layout wrapper component
const AdminLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (page: string) => {
    // Convert admin page names to routes
    const routeMap: Record<string, string> = {
      'admin-dashboard': '/admin/dashboard',
      'admin-users': '/admin/users',
      'admin-communities': '/admin/communities',
      'admin-resources': '/admin/resources',
      'admin-marketplace': '/admin/marketplace',
      'admin-reports': '/admin/reports',
      'admin-events': '/admin/events',
      'admin-login': '/admin/login',
      'home': '/',
    };
    navigate(routeMap[page] || `/${page.replace('admin-', 'admin/')}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Get current page name from location
  const getCurrentPage = () => {
    const path = location.pathname;
    // Convert /admin/dashboard to admin-dashboard
    return path.slice(1).replace('/', '-');
  };

  return (
    <AdminGuard onNavigate={handleNavigate}>
      <AdminLayout
        currentPage={getCurrentPage()}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {children}
      </AdminLayout>
    </AdminGuard>
  );
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Inner app component that uses auth context and router
function AppContent() {
  const { loading } = useAuth();
  const navigate = useNavigate();

  // Navigation helper for components
  const createNavigate = (routeMap: Record<string, string>) => (page: string) => {
    navigate(routeMap[page] || `/${page}`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public routes with MainLayout */}
        <Route path="/" element={
          <MainLayoutWrapper>
            <LandingView
              onExplore={() => navigate('/marketplace')}
              onNavigateToAIConcierge={() => navigate('/ai-concierge')}
            />
          </MainLayoutWrapper>
        } />

        <Route path="/marketplace" element={
          <MainLayoutWrapper>
            <MarketplaceView />
          </MainLayoutWrapper>
        } />

        <Route path="/communities" element={
          <MainLayoutWrapper>
            <CommunitiesLandingView />
          </MainLayoutWrapper>
        } />

        <Route path="/communities/:slug" element={
          <MainLayoutWrapper>
            <CommunityDetailView />
          </MainLayoutWrapper>
        } />

        <Route path="/communities/:slug/sub/:subId" element={
          <ProtectedRoute>
            <MainLayoutWrapper>
              <SubCommunityDashboard />
            </MainLayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/my-communities" element={
          <ProtectedRoute>
            <MainLayoutWrapper>
              <MyCommunitiesView />
            </MainLayoutWrapper>
          </ProtectedRoute>
        } />

        <Route path="/ai-concierge" element={
          <MainLayoutWrapper>
            <AIConciergeView />
          </MainLayoutWrapper>
        } />

        <Route path="/accueil" element={
          <MainLayoutWrapper>
            <AccueilView />
          </MainLayoutWrapper>
        } />

        <Route path="/messaging" element={
          <ProtectedRoute>
            <MainLayoutWrapper>
              <MessagingView />
            </MainLayoutWrapper>
          </ProtectedRoute>
        } />

        {/* Auth routes - no layout */}
        <Route path="/login" element={<LoginPage onNavigate={(page) => navigate(`/${page}`)} />} />
        <Route path="/signup" element={<SignUpPage onNavigate={(page) => navigate(`/${page}`)} />} />

        {/* Protected dashboard route */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayoutWrapper>
              <DashboardView />
            </MainLayoutWrapper>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/login" element={
          <AdminLoginPage onNavigate={(page) => {
            const routeMap: Record<string, string> = {
              'admin-dashboard': '/admin/dashboard',
              'home': '/',
            };
            navigate(routeMap[page] || `/${page.replace('admin-', 'admin/')}`);
          }} />
        } />

        <Route path="/admin/dashboard" element={
          <AdminLayoutWrapper>
            <AdminDashboardView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/users" element={
          <AdminLayoutWrapper>
            <UserManagementView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/communities" element={
          <AdminLayoutWrapper>
            <AdminCommunitiesView />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/resources" element={
          <AdminLayoutWrapper>
            <ResourceManagementView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/marketplace" element={
          <AdminLayoutWrapper>
            <AdminMarketplaceView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/reports" element={
          <AdminLayoutWrapper>
            <AdminReportsView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        <Route path="/admin/events" element={
          <AdminLayoutWrapper>
            <EventManagementView onNavigate={(page) => navigate(`/${page.replace('admin-', 'admin/')}`)} />
          </AdminLayoutWrapper>
        } />

        {/* Redirect /admin to /admin/login */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// Main App component with providers
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}