import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Sidebar from './components/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Expenses from './components/pages/Expenses';
import SavingsPlan from './components/pages/SavingsPlan';
import MySubscriptions from './components/pages/MySubscriptions';
import ExpenseAnalytics from './components/pages/ExpenseAnalytics';
import Homepage from './components/Homepage';
import Login from './Users/Login';
import Signup from './Users/Signup';

// Import API service
import api from './services/api';
import AuthService from './services/authService';

// Import Auth Context
import { AuthContext, useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect authenticated users away from login/signup pages
  // Allow authenticated users to see homepage
  if (isAuthenticated && window.location.pathname !== '/' && 
      (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app load
  useEffect(() => {
    // Set a maximum timeout to ensure loading completes quickly
    const maxTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 second maximum timeout

    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
          try {
            // First set user from localStorage immediately for better UX
            setIsAuthenticated(true);
            setUser(JSON.parse(userData));
            setLoading(false); // Allow app to render while validating in background
            
            // Then validate token with backend in background (non-blocking)
            const isValid = await Promise.race([
              AuthService.validateToken(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 2000)
              )
            ]);
            
            if (!isValid) {
              // Token is invalid, clear it
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            // If validation fails (backend down, network error, etc.), 
            // keep using cached data - don't log out user
            console.warn('Auth validation failed, using cached user data:', error.message);
          }
        } else {
          // No token, user is not authenticated
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setLoading(false);
      }
    };

    checkAuthStatus();

    // Cleanup function
    return () => {
      clearTimeout(maxTimeout);
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, message: response.message || 'Login successful' };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed. Please try again.' };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await api.signup(userData);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, message: response.message || 'Account created successfully' };
      } else {
        return { success: false, message: response.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message || 'Signup failed. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Auth context value
  const authValue = {
    isAuthenticated,
    user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={authValue}>
      <Router>
        <div className="font-sans text-gray-800">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <Homepage />
              </PublicRoute>
            } />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/expenses" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <Expenses />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/savings-plan" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <SavingsPlan />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <MySubscriptions />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute>
                <div className="flex h-screen bg-gray-100">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto">
                    <ExpenseAnalytics />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            {/* Redirect root dashboard to /dashboard */}
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;

