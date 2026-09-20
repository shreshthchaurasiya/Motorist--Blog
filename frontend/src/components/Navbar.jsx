import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, LayoutDashboard, UserCircle, MoreVertical, Search, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import AuthModal from './AuthModal';
import logo from '../assets/logo.png';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const [publicUser, setPublicUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(title)}`);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const res = await axios.get(`${API_URL}/api/blogs?search=${encodeURIComponent(searchQuery.trim())}`);
          setSuggestions(res.data);
          setShowSuggestions(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const user = localStorage.getItem('publicUser');
    if (user) setPublicUser(JSON.parse(user));

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsAdminMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Hamburger - mobile only */}
          <button className="icon-btn hamburger-btn">
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to="/" className="navbar-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Motorist" />
          </Link>

          {/* Desktop Search */}
          <div style={{ position: 'relative', marginLeft: 'auto' }} ref={searchRef}>
            <form className="navbar-search" onSubmit={handleSearch}>
              <Search size={15} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => { if(searchQuery) setShowSuggestions(true); }}
              />
            </form>

            {/* Suggestions Dropdown (Desktop) */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden', zIndex: 1000, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s ease' }}>
                {suggestions.slice(0, 5).map((blog) => (
                  <div 
                    key={blog.id} 
                    onClick={() => handleSuggestionClick(blog.title)}
                    style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Search size={14} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="navbar-right">
            {/* Mobile search icon */}
            <button
              className="icon-btn mobile-search-btn"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search size={20} />
            </button>

            {/* Admin three-dot menu */}
            {isAuthenticated && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className="icon-btn"
                >
                  <MoreVertical size={22} />
                </button>

                {isAdminMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    minWidth: '180px',
                    overflow: 'hidden',
                    zIndex: 200,
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsAdminMenuOpen(false)}
                      style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LayoutDashboard size={16} color="var(--primary-light)" /> Dashboard
                    </Link>
                    <Link
                      to="/create"
                      onClick={() => setIsAdminMenuOpen(false)}
                      style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500', borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <PlusCircle size={16} color="var(--primary-light)" /> New Blog
                    </Link>
                    <button
                      onClick={() => { setIsAdminMenuOpen(false); onLogout(); }}
                      style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500', width: '100%', textAlign: 'left', transition: 'background 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Public Profile Icon */}
            {location.pathname === '/' && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="icon-btn"
                title={publicUser ? publicUser.name : 'Login / Sign up'}
                style={{ color: publicUser ? 'var(--primary-light)' : 'white' }}
              >
                {publicUser ? (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: 'white' }}>
                    {publicUser.name?.[0]?.toUpperCase()}
                  </div>
                ) : (
                  <UserCircle size={24} color="#ffffff" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay - Full Screen */}
        {isMobileSearchOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 9999, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
            {/* Search Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--surface)' }}>
              <Search size={20} color="var(--text-secondary)" />
              <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex' }}>
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  autoFocus 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.1rem', outline: 'none' }}
                />
              </form>
              <button type="button" onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); setSuggestions([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                <X size={24} />
              </button>
            </div>

            {/* Suggestions List (Mobile Fullscreen) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {showSuggestions && suggestions.length > 0 ? (
                suggestions.map((blog) => (
                  <div 
                    key={blog.id} 
                    onClick={() => handleSuggestionClick(blog.title)}
                    style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--surface-border)' }}
                  >
                    <Search size={18} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.title}</span>
                  </div>
                ))
              ) : (
                searchQuery.trim() && (
                   <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                     Press Enter to search for <span style={{ color: 'var(--primary-light)' }}>"{searchQuery}"</span>
                   </div>
                )
              )}
            </div>
          </div>
        )}
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
