import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BuildResume from './pages/BuildResume';
import MyApplications from './pages/MyApplications';
import ManageMembers from './pages/ManageMembers';
import ApplicationsList from './pages/ApplicationsList';
import ResetTempPassword from './pages/ResetTempPassword';

// Route Guard for logged-in users (forces temp password reset if active)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isTempPassword) {
    return <Navigate to="/reset-temp-password" replace />;
  }

  return children;
};

// Guard specifically for the Reset Temp Password page
const TempPasswordRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isTempPassword) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route Guard for specific roles
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Layout Wrapper
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 70px)', paddingBottom: '40px' }}>
        {children}
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Reset Temp Password Guarded Route */}
          <Route path="/reset-temp-password" element={
            <TempPasswordRoute>
              <ResetTempPassword />
            </TempPasswordRoute>
          } />

          {/* Protected Routes (Wrapper handles Auth check + Navbar rendering) */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/resume" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['MEMBER']}>
                <AppLayout>
                  <BuildResume />
                </AppLayout>
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/my-applications" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['MEMBER']}>
                <AppLayout>
                  <MyApplications />
                </AppLayout>
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['NC_ADMIN']}>
                <AppLayout>
                  <ManageMembers />
                </AppLayout>
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/applications" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['LC_ADMIN', 'NC_ADMIN']}>
                <AppLayout>
                  <ApplicationsList />
                </AppLayout>
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
