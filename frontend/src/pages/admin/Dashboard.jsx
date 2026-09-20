import { API_URL } from '../../config';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Upload, UserCircle2, Edit2, Check, X } from 'lucide-react';

const Dashboard = () => {
  const [blogs, setBlogs] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // comment id being replied to
  const [replyText, setReplyText] = useState('');

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [blogsRes, adminRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/blogs`),
        axios.get(`${API_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBlogs(blogsRes.data);
      setAdmin(adminRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete blog');
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPic(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/profile-picture`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      fetchDashboardData(); // Refresh admin data
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      setEditingName(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/profile-name`, { displayName: newName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
      setEditingName(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update name');
    }
  };

  const handleAdminReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/comments/${commentId}/reply`, { adminReply: replyText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReplyText('');
      setReplyingTo(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to send reply');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Admin Profile Section */}
      <div className="glass-panel mb-8" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ position: 'relative' }}>
          {admin?.profilePicture ? (
            <img 
              src={`${API_URL}${admin.profilePicture}`} 
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--surface-border)' }}
            />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #dc2743)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <UserCircle2 size={50} />
            </div>
          )}
          
          <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}>
            <Upload size={16} />
            <input type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ display: 'none' }} disabled={uploadingPic} />
          </label>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="form-input"
                  style={{ padding: '0.2rem 0.5rem', width: '150px' }}
                  placeholder="Your Name"
                  autoFocus
                />
                <button onClick={handleNameUpdate} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Check size={18} /></button>
                <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
            ) : (
              <>
                <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
                  {admin?.displayName || admin?.username}
                </h2>
                <button 
                  onClick={() => { setEditingName(true); setNewName(admin?.displayName || admin?.username || ''); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Change Name"
                >
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>@{admin?.username}</p>
          {uploadingPic && <span style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>Uploading...</span>}
        </div>
      </div>

      <div className="flex-between mb-8">
        <h1 style={{ color: 'var(--text-primary)' }}>Your Published Blogs</h1>
        <div style={{ color: 'var(--text-secondary)' }}>Total: {blogs.length} posts</div>
      </div>
      
      {blogs.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '4rem 2rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>No blogs found!</h3>
          <p>Click on "New Blog" to write your first article.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {blogs.map(blog => (
            <div key={blog.id} className="glass-panel blog-card">
              {blog.imageUrl && (
                <img src={`${API_URL}${blog.imageUrl}`} alt={blog.title} className="blog-image" />
              )}
              <div className="blog-content" style={{ padding: '1rem' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>{blog.title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {blog.content}
                </p>
                <div className="flex-between" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                  <div className="blog-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {blog.admin?.profilePicture ? (
                      <img src={`${API_URL}${blog.admin.profilePicture}`} alt="author" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #dc2743)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>
                        {(blog.admin?.username || blog.author || 'A')[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.875rem' }}>{blog.admin?.displayName || blog.admin?.username || blog.author}</span>
                  </div>
                  <button onClick={() => handleDelete(blog.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications Section */}
      <div className="flex-between mb-8" style={{ marginTop: '3rem' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
      </div>
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No new comments yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{notif.user.name} commented on "{notif.blog.title}"</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{notif.text}</p>
                
                {notif.adminReply ? (
                  <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', borderLeft: '2px solid var(--text-secondary)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Your Reply:</span>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{notif.adminReply}</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem' }}>
                    {replyingTo === notif.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          className="form-input"
                          style={{ flex: 1, padding: '0.5rem', background: 'transparent' }}
                          autoFocus
                        />
                        <button onClick={() => handleAdminReply(notif.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Send</button>
                        <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setReplyingTo(notif.id); setReplyText(''); }} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
                        Reply to User
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
