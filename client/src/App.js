import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/user/Dashboard';
import Scores from './pages/user/Scores';
import DrawPage from './pages/user/DrawPage';
import CharitiesPage from './pages/CharitiesPage';
import CharityDetail from './pages/CharityDetail';
import Subscribe from './pages/Subscribe';
import WinnersPage from './pages/user/WinnersPage';
import Profile from './pages/user/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDraws from './pages/admin/AdminDraws';
import AdminCharities from './pages/admin/AdminCharities';
import AdminWinners from './pages/admin/AdminWinners';
import AdminReports from './pages/admin/AdminReports';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Loader from './components/common/Loader';

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirect if already logged in
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { loading } = useAuth();
  if (loading) return <Loader />;

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/charities" element={<CharitiesPage />} />
          <Route path="/charities/:id" element={<CharityDetail />} />
          <Route path="/subscribe" element={<Subscribe />} />

          {/* Guest only */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Subscriber */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
          <Route path="/draw" element={<ProtectedRoute><DrawPage /></ProtectedRoute>} />
          <Route path="/winners" element={<ProtectedRoute><WinnersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/draws" element={<ProtectedRoute adminOnly><AdminDraws /></ProtectedRoute>} />
          <Route path="/admin/charities" element={<ProtectedRoute adminOnly><AdminCharities /></ProtectedRoute>} />
          <Route path="/admin/winners" element={<ProtectedRoute adminOnly><AdminWinners /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: '12px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
