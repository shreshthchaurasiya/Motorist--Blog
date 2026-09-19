import { Link, useLocation } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard, KeyRound, UserCircle, MoreVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AuthModal from './AuthModal';
import logo from '../assets/logo.png';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const [publicUser, setPublicUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('publicUser');
    if (user) {
      setPublicUser(JSON.parse(user));
    }
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.8rem 5%', 
        backgroundColor: '#1a1528', 
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={logo} alt="Motorist Logo" style={{ height: '40px' }} />
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {isAuthenticated && (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button 
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
              >
                <MoreVertical size={24} />
              </button>
              
              {isAdminMenuOpen && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '0.5rem',
                  background: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  zIndex: 50
                }}>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsAdminMenuOpen(false)}
                    style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--surface-border)' }}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link 
                    to="/create" 
                    onClick={() => setIsAdminMenuOpen(false)}
                    style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--surface-border)' }}
                  >
                    <PlusCircle size={16} /> New Blog
                  </Link>
                  <button 
                    onClick={() => { setIsAdminMenuOpen(false); onLogout(); }} 
                    style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', textAlign: 'left', width: '100%' }}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Public Profile Icon - Only visible on public Home page */}
          {location.pathname === '/' && (
            <button onClick={() => setIsAuthModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title={publicUser ? 'Edit Profile' : 'User Profile'}>
              <UserCircle size={24} color="#ffffff" />
            </button>
          )}
        </div>
      </nav>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(user) => setPublicUser(user)}
        initialName={publicUser?.name || ''}
        initialPhone={publicUser?.phoneNumber || ''}
      />
    </>
  );
};

export default Navbar;
