import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Edit2, User } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onSuccess, initialName = '', initialPhone = '' }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'profile'
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine mode on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setPassword('');
      setConfirmPassword('');
      setName(initialName);
      setPhone(initialPhone);
      
      // If they already have a name and phone, show profile view
      if (initialName && initialPhone) {
        setMode('profile');
      } else {
        setMode('login');
      }
    }
  }, [isOpen, initialName, initialPhone]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) return setError('Phone and Password are required');
    
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(``, { phoneNumber: phone, password });
      localStorage.setItem('publicToken', res.data.token);
      localStorage.setItem('publicUser', JSON.stringify(res.data.user));
      onSuccess(res.data.user);
      setMode('profile');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !phone || !password || !confirmPassword) return setError('All fields are required');
    if (password.length < 8) return setError('Password must be at least 8 characters long');
    if (password !== confirmPassword) return setError('Passwords do not match');
    
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(``, { phoneNumber: phone, name, password });
      localStorage.setItem('publicToken', res.data.token);
      localStorage.setItem('publicUser', JSON.stringify(res.data.user));
      onSuccess(res.data.user);
      setMode('profile');
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        
        {mode === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>Your Profile</h2>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '30px', fontWeight: 'bold', marginBottom: '1rem' }}>
              {name[0]?.toUpperCase()}
            </div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{name}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>{phone}</p>
            
            <button 
              onClick={() => {
                localStorage.removeItem('publicToken');
                localStorage.removeItem('publicUser');
                window.location.reload();
              }} 
              className="btn btn-outline" 
              style={{ width: '100%', color: 'var(--danger)' }}
            >
              Sign Out
            </button>
          </div>
        )}

        {mode === 'login' && (
          <>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>Login</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>Login to like and comment on posts.</p>
            
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', background: 'rgba(220,39,67,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="E.g., 9876543210" required />
              </div>
              <div className="form-group mb-8">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Don't have an account? </span>
              <button onClick={() => { setMode('signup'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>Create new</button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>Join to like and comment on posts.</p>
            
            {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', background: 'rgba(220,39,67,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
            
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Rahul Sharma" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="E.g., 9876543210" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password (Min 8 chars)</label>
                <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required minLength={8} />
              </div>
              <div className="form-group mb-8">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required minLength={8} />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Already have an account? </span>
              <button onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>Login here</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
