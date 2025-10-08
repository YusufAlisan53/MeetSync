import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import UserManagement from "./pages/UserManagement";
import UserProfiles from "./pages/UserProfiles";
import RoomManagement from "./pages/RoomManagement";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import AllEvents from "./pages/AllEvents";
import PendingApprovals from "./pages/PendingApprovals";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import AddEvent from "./pages/AddEvent";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./components/ui/ToastProvider";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-gray-600 dark:border-t-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

// Admin Protected Route Component
function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-gray-600 dark:border-t-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Admin kontrolü
  const isAdmin = user?.isAdmin || user?.roles?.includes('Admin') || user?.roles?.includes('Users.Admin') || false;
  
  if (!isAdmin) {
    // Admin olmayan kullanıcıları Calendar sayfasına yönlendir
    return <Navigate to="/calendar" replace />;
  }

  return <>{children}</>;
}

// Room Management Protected Route Component
function RoomManagementProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-gray-600 dark:border-t-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Oda yönetimi yetkisi kontrolü
  const canManageRooms = user?.isAdmin || 
    user?.roles?.includes('Admin') || 
    user?.roles?.includes('Users.Admin') ||
    user?.roles?.includes('System.Manager');
  
  if (!canManageRooms) {
    // Yetkisi olmayan kullanıcıları Calendar sayfasına yönlendir
    return <Navigate to="/calendar" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (sadece giriş yapmamış kullanıcılar için)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-gray-600 dark:border-t-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/calendar" replace />;
  }

  return <>{children}</>;
}

// Root Redirect Component
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4 dark:border-gray-600 dark:border-t-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/calendar" replace />;
  } else {
    return <Navigate to="/signin" replace />;
  }
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Protected Dashboard Layout */}
          <Route 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Basic Protected Routes - Tüm kullanıcılar erişebilir */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/add-event" element={<AddEvent />} />
            <Route path="/all-events" element={<AllEvents />} />
            <Route path="/pending-approvals" element={<PendingApprovals />} />
            <Route path="/profile" element={<UserProfiles />} />

            {/* Admin Protected Routes - Sadece admin kullanıcılar erişebilir */}
            <Route path="/user-management" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />
            <Route path="/blank" element={<AdminProtectedRoute><Blank /></AdminProtectedRoute>} />

            {/* Room Management Protected Routes - Admin ve System.Manager erişebilir */}
            <Route path="/room-management" element={<RoomManagementProtectedRoute><RoomManagement /></RoomManagementProtectedRoute>} />

            {/* Forms - Admin only */}
            <Route path="/form-elements" element={<AdminProtectedRoute><FormElements /></AdminProtectedRoute>} />

            {/* Tables - Admin only */}
            <Route path="/basic-tables" element={<AdminProtectedRoute><BasicTables /></AdminProtectedRoute>} />

            {/* Ui Elements - Admin only */}
            <Route path="/alerts" element={<AdminProtectedRoute><Alerts /></AdminProtectedRoute>} />
            <Route path="/avatars" element={<AdminProtectedRoute><Avatars /></AdminProtectedRoute>} />
            <Route path="/badge" element={<AdminProtectedRoute><Badges /></AdminProtectedRoute>} />
            <Route path="/buttons" element={<AdminProtectedRoute><Buttons /></AdminProtectedRoute>} />
            <Route path="/images" element={<AdminProtectedRoute><Images /></AdminProtectedRoute>} />
            <Route path="/videos" element={<AdminProtectedRoute><Videos /></AdminProtectedRoute>} />

            {/* Charts - Admin only */}
            <Route path="/line-chart" element={<AdminProtectedRoute><LineChart /></AdminProtectedRoute>} />
            <Route path="/bar-chart" element={<AdminProtectedRoute><BarChart /></AdminProtectedRoute>} />
          </Route>

          {/* Public Routes */}
          <Route 
            path="/signin" 
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            } 
          />

          {/* Error 404 Page - Admin only (since it's under Others/Pages) */}
          <Route 
            path="/error-404" 
            element={
              <AdminProtectedRoute>
                <NotFound />
              </AdminProtectedRoute>
            } 
          />

          {/* Root redirect - Auth durumuna göre yönlendir */}
          <Route 
            index 
            path="/" 
            element={
              <RootRedirect />
            } 
          />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
