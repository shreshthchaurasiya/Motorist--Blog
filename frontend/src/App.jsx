import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Search from './pages/Search';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import CreateBlog from './pages/admin/CreateBlog';
import Navbar from './components/Navbar';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);

    // Global Axios Interceptor for 401 Unauthorized
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Check if it's an admin route
          const configUrl = error.config.url || '';
          if (!configUrl.includes('/api/users/')) {
            handleLogout();
          } else {
            // It's a public user auth failure
            localStorage.removeItem('publicToken');
            localStorage.removeItem('publicUser');
            // Force reload to clear state and show auth modal if needed
            window.location.reload();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={!isAuthenticated ? <AdminLogin onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/admin" replace />} />
        <Route path="/create" element={isAuthenticated ? <CreateBlog /> : <Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
