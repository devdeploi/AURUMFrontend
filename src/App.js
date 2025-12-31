import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Admin Dashboard
import MerchantDashboard from './components/MerchantDashboard';
import MerchantRegister from './components/MerchantRegister';

// Protected Route Component
const ProtectedRoute = ({ userRole, allowedRole, children }) => {
  if (!userRole) {
    return <Navigate to="/" replace />;
  }
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Wrappers to handle navigation logic inside Router context
const LoginWrapper = ({ onLogin }) => {
  const navigate = useNavigate();
  return (
    <Login
      onLogin={onLogin}
      onRegisterClick={() => navigate('/register')}
    />
  );
};

const RegisterWrapper = ({ onRegister }) => {
  const navigate = useNavigate();
  return (
    <MerchantRegister
      onRegister={onRegister}
      onSwitchToLogin={() => navigate('/')}
    />
  );
};

function App() {
  const [userRole, setUserRole] = useState(null); // 'admin', 'merchant' or null (not logged in)
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (role, userData) => {
    setUserRole(role);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
  };

  const handleRegister = (newMerchantData) => {
    // Automatically login after register
    handleLogin('merchant', newMerchantData);
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              !userRole ? (
                <LoginWrapper onLogin={handleLogin} />
              ) : (
                <Navigate to={userRole === 'admin' ? '/admin-dashboard' : '/merchant-dashboard'} replace />
              )
            }
          />

          <Route
            path="/register"
            element={
              !userRole ? (
                <RegisterWrapper onRegister={handleRegister} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute userRole={userRole} allowedRole="admin">
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/merchant-dashboard"
            element={
              <ProtectedRoute userRole={userRole} allowedRole="merchant">
                <MerchantDashboard user={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
