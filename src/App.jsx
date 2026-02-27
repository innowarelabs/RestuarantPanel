import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header/Header';
import { toggleSidebar, setCollapsed, setRestaurantName } from './redux/store';

// Page Imports
import Dashboard from './pages/Dashboard/Dashboard';
import Order from './pages/Order/Order';
import MenuManagement from './pages/MenuManagement/MenuManagement';
import Customers from './pages/Customers/Customers';
import Analytics from './pages/Analytics/Analytics';
import LoyaltyProgram from './pages/LoyaltyProgram/LoyaltyProgram';
import Reports from './pages/Reports/Reports';
import Supports from './pages/Supports/Supports';
import Settings from './pages/Settings/Settings';
import OnboardingStep from './pages/OnboardingStep/OnboardingStep';
import Login from './pages/public/Login';
import ForgotPassword from './pages/public/ForgotPassword';
import VerifyAccount from './pages/public/VerifyAccount';
import ResetPassword from './pages/public/ResetPassword';
import PasswordResetSuccess from './pages/public/PasswordResetSuccess';
import Setup2FAQR from './pages/comman/Setup2FAQR';
import Verify2FAOTP from './pages/comman/Verify2FAOTP';

function App() {
  const isCollapsed = useSelector((state) => state.sidebar.isCollapsed);
  const dispatch = useDispatch();
  const location = useLocation();

  // Initialize sidebar state based on screen width
  useEffect(() => {
    if (window.innerWidth < 768) {
      dispatch(setCollapsed(true));
    }
  }, [dispatch]);

  // Close sidebar on navigation (for mobile)
  useEffect(() => {
    if (window.innerWidth < 768) {
      dispatch(setCollapsed(true));
    }
  }, [location.pathname, dispatch]);

  const handleToggleSidebar = () => dispatch(toggleSidebar());

  const isOnboarding = location.pathname === '/onboarding';
  const accessToken = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);
  const restaurantName = useSelector((state) => state.auth.restaurantName);
  const onboardingStep = useSelector((state) => state.auth.onboardingStep);
  const isAuthenticated = !!accessToken;
  const fetchedRestaurantNameRef = useRef(false);
  const isTwoFAPending = localStorage.getItem('twoFAStatus') === 'pending';
  const is2FAEnabled = user?.is_2fa_enabled === true;
  const is2FASetup = user?.is_2fa_setup === true;
  const twoFANextRoute = is2FASetup ? '/verify-2fa-otp' : '/setup-2fa-qr';
  const is2FARoute = ['/setup-2fa-qr', '/verify-2fa-otp'].includes(location.pathname);

  useEffect(() => {
    if (!isTwoFAPending) return;
    if (!is2FAEnabled) {
      localStorage.removeItem('twoFAStatus');
      localStorage.removeItem('twoFANextRoute');
      localStorage.removeItem('twoFAUserId');
      localStorage.removeItem('twoFAGoto');
      return;
    }
    localStorage.setItem('twoFANextRoute', twoFANextRoute);
  }, [is2FAEnabled, isTwoFAPending, twoFANextRoute]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!accessToken) return;
    if (restaurantName?.trim()) return;
    if (fetchedRestaurantNameRef.current) return;
    fetchedRestaurantNameRef.current = true;

    const fetchRestaurantName = async () => {
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL;
        if (!baseUrl) return;

        const url = `${baseUrl.replace(/\/$/, '')}/api/v1/restaurants/onboarding/step1`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const contentType = res.headers.get('content-type');
        const data = contentType?.includes('application/json') ? await res.json() : await res.text();

        const extractStep1Payload = (raw) => {
          if (!raw) return null;
          if (typeof raw === 'string') {
            const text = raw.trim();
            if (!text) return null;
            try {
              const parsed = JSON.parse(text);
              return extractStep1Payload(parsed);
            } catch {
              return null;
            }
          }

          if (typeof raw !== 'object') return null;
          const nested = raw?.data?.data && typeof raw.data.data === 'object' ? raw.data.data : null;
          const top = raw?.data && typeof raw.data === 'object' ? raw.data : null;
          return nested || top || raw;
        };

        const step1 = extractStep1Payload(data);
        const companyName = typeof step1?.company_name === 'string' ? step1.company_name.trim() : '';
        if (companyName) dispatch(setRestaurantName(companyName));
      } catch {
        fetchedRestaurantNameRef.current = false;
      }
    };

    fetchRestaurantName();
  }, [accessToken, dispatch, isAuthenticated, restaurantName]);

  if (isTwoFAPending && is2FAEnabled) {
    if (!is2FARoute) return <Navigate to={twoFANextRoute} replace />;

    return (
      <Routes>
        <Route path="/setup-2fa-qr" element={<Setup2FAQR />} />
        <Route path="/verify-2fa-otp" element={<Verify2FAOTP />} />
        <Route path="*" element={<Navigate to={twoFANextRoute} replace />} />
      </Routes>
    );
  }

  if (is2FARoute && !isTwoFAPending) {
    const storedOnboardingStep = localStorage.getItem('onboardingStep');
    const storedTwoFAGoto = localStorage.getItem('twoFAGoto');
    const resolvedGoto =
      typeof storedOnboardingStep === 'string' && storedOnboardingStep.trim()
        ? storedOnboardingStep.trim()
        : typeof storedTwoFAGoto === 'string' && storedTwoFAGoto.trim()
          ? storedTwoFAGoto.trim()
          : onboardingStep;
    if (resolvedGoto === 'dashboard') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !['/login', '/forgot-password', '/verify-account', '/reset-password', '/password-reset-success'].includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  // Auth Routes (Public)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Handle redirects for authenticated users on auth pages
  if (isAuthenticated && ['/login', '/forgot-password', '/verify-account', '/reset-password', '/password-reset-success'].includes(location.pathname)) {
    if (onboardingStep === 'dashboard') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding Page (Fullscreen)
  if (isOnboarding) {
    if (onboardingStep === 'dashboard') return <Navigate to="/admin-dashboard" replace />;
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingStep />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-general-text">
      {/* Sidebar - Mobile Drawer */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${!isCollapsed ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${!isCollapsed ? 'opacity-100' : 'opacity-0'}`}
          onClick={handleToggleSidebar}
        />
        {/* Sidebar container */}
        <div className={`absolute left-0 top-0 bottom-0 w-[261px] transform transition-transform duration-300 ${!isCollapsed ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar isCollapsed={false} onToggleCollapse={handleToggleSidebar} />
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block h-full transition-all duration-300">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleSidebar} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMobileMenuClick={handleToggleSidebar} // Simplified for demo
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />

            {/* Main Routes */}
            <Route path="/admin-dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/menu-management" element={<MenuManagement />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/global-analytics" element={<Analytics />} />
            <Route path="/loyalty-program" element={<LoyaltyProgram />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/supports" element={<Supports />} />
            <Route path="/settings" element={<Settings />} />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
