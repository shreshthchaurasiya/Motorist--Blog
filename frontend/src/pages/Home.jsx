import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Send } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Auth state for public users
  const [publicUser, setPublicUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'like' or 'comment'

  // Comment states
  const [activeCommentBlog, setActiveCommentBlog] = useState(null); // Which blog has all comments expanded
  const [commentTexts, setCommentTexts] = useState({}); // Store comment text per blog id
  const [expandedReplies, setExpandedReplies] = useState({}); // Track which comments have expanded replies

  useEffect(() => {
    const user = localStorage.getItem('publicUser');
    if (user) setPublicUser(JSON.parse(user));
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/blogs');
      setBlogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = (action, blogId) => {
    if (publicUser) return true;
    setPendingAction({ type: action, blogId });
    setIsAuthModalOpen(true);
    return false;
  };

  const handleAuthSuccess = (user) => {
    setPublicUser(user);
    if (pendingAction) {
      if (pendingAction.type === 'like') handleLike(pendingAction.blogId);
      if (pendingAction.type === 'comment') setActiveCommentBlog(pendingAction.blogId);
      setPendingAction(null);
    }
  };

  const handleLike = async (blogId) => {
    if (!requireAuth('like', blogId)) return;

    try {
      const token = localStorage.getItem('publicToken');
      const res = await axios.post(`http://localhost:5000/api/blogs/${blogId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optimistic UI update
      setBlogs(blogs.map(blog => {
        if (blog.id === blogId) {
          const isLiked = res.data.liked;
          const currentLikes = blog.likes || [];
          return {
            ...blog,
            likes: isLiked 
              ? [...currentLikes, { userId: publicUser.id }] 
              : currentLikes.filter(l => l.userId !== publicUser.id)
          };
        }
        return blog;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e, blogId) => {
    e.preventDefault();
    if (!requireAuth('comment', blogId)) return;
    const text = commentTexts[blogId];
    if (!text || !text.trim()) return;

    try {
      const token = localStorage.getItem('publicToken');
      const res = await axios.post(`http://localhost:5000/api/blogs/${blogId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCommentTexts({ ...commentTexts, [blogId]: '' });
      setBlogs(blogs.map(blog => {
        if (blog.id === blogId) {
          return { ...blog, comments: [...(blog.comments || []), res.data] };
        }
        return blog;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="feed-container">
      {blogs.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '4rem 2rem', marginTop: '2rem' }}>
          <h3 style={{ color: 'var(--text-secondary)' }}>No posts yet</h3>
        </div>
      ) : (
        blogs.map(blog => {
          const isLikedByMe = publicUser && blog.likes?.some(l => l.userId === publicUser.id);
          const likeCount = blog.likes?.length || 0;

          return (
            <article key={blog.id} className="blog-card" style={{ marginBottom: '2rem', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden' }}>
              {/* Post Header (Author) */}
              <header className="blog-header" style={{ padding: '1rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--surface-border)' }}>
                {blog.admin?.profilePicture ? (
                  <img 
                    src={`http://localhost:5000${blog.admin.profilePicture}`} 
                    alt={blog.admin.username} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px' }} 
                  />
                ) : (
                  <div className="blog-author-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #dc2743)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginRight: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                    {(blog.admin?.displayName || blog.admin?.username || blog.author || 'A')[0].toUpperCase()}
                  </div>
                )}
                <span className="blog-author-name" style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {blog.admin?.displayName || blog.admin?.username || blog.author}
                </span>
              </header>

              {/* Post Image */}
              {blog.imageUrl && (
                <img src={`http://localhost:5000${blog.imageUrl}`} alt={blog.title} style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} />
              )}


              {/* Post Content */}
              <div style={{ padding: '0.8rem 1rem 0.2rem 1rem' }}>
                <span style={{ fontWeight: '600', marginRight: '8px', color: 'var(--text-primary)' }}>{blog.admin?.displayName || blog.admin?.username || blog.author}</span>
                <span style={{ color: 'var(--text-primary)' }}>{blog.content}</span>
              </div>

              {/* Action Buttons */}
              <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleLike(blog.id)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isLikedByMe ? '#ed4956' : 'var(--text-primary)' }}
                >
                  <Heart size={24} fill={isLikedByMe ? '#ed4956' : 'transparent'} />
                </button>
                <button 
                  onClick={() => {
                    const input = document.getElementById(`comment-input-${blog.id}`);
                    if (input) input.focus();
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-primary)' }}
                >
                  <MessageCircle size={24} />
                </button>
              </div>

              {/* Likes and Comments Count */}
              <div style={{ padding: '0 1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                <span>{blog.comments?.length || 0} {blog.comments?.length === 1 ? 'comment' : 'comments'}</span>
              </div>
              
              {/* Inline Comments Section (Instagram Style) */}
              <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
                {blog.comments?.length > 2 && (
                  <div 
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '0.2rem', fontSize: '0.875rem' }}
                    onClick={() => setActiveCommentBlog(activeCommentBlog === blog.id ? null : blog.id)}
                  >
                    {activeCommentBlog === blog.id ? 'Hide comments' : `View all ${blog.comments.length} comments`}
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(activeCommentBlog === blog.id ? blog.comments : blog.comments?.slice(-2))?.map(comment => (
                    <div key={comment.id} style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                      <div>
                        <span style={{ fontWeight: '600', marginRight: '0.5rem', color: 'var(--text-primary)' }}>{comment.user.name}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{comment.text}</span>
                      </div>
                      
                      {/* Threaded Admin Reply */}
                      {comment.adminReply && (
                        <div style={{ marginTop: '0.2rem' }}>
                          {!expandedReplies[comment.id] ? (
                            <div 
                              onClick={() => setExpandedReplies(prev => ({...prev, [comment.id]: true}))}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', marginTop: '0.2rem' }}
                            >
                              <div style={{ width: '20px', height: '1px', background: 'var(--text-secondary)' }}></div>
                              View 1 reply
                            </div>
                          ) : (
                            <div style={{ marginLeft: '1rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', animation: 'fadeIn 0.3s ease' }}>
                              {blog.admin?.profilePicture ? (
                                <img src={`http://localhost:5000${blog.admin.profilePicture}`} alt="admin" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                                  {(blog.admin?.username || 'A')[0].toUpperCase()}
                                </div>
                              )}
                              <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                <span style={{ fontWeight: '600', marginRight: '0.5rem', color: 'var(--text-primary)' }}>{blog.admin?.username}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{comment.adminReply}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div style={{ padding: '0 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>

              {/* Add Comment Input */}
              <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center' }}>
                <form onSubmit={(e) => handleComment(e, blog.id)} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <input 
                    id={`comment-input-${blog.id}`}
                    type="text" 
                    value={commentTexts[blog.id] || ''}
                    onChange={(e) => setCommentTexts({...commentTexts, [blog.id]: e.target.value})}
                    placeholder="Add a comment..."
                    autoComplete="off"
                    onClick={() => { if(!publicUser) requireAuth('comment', blog.id); }}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                  />
                  <button 
                    type="submit" 
                    disabled={!(commentTexts[blog.id] || '').trim()} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', opacity: (commentTexts[blog.id] || '').trim() ? 1 : 0.5, fontSize: '0.875rem' }}
                  >
                    Post
                  </button>
                </form>
              </div>
            </article>
          );
        })
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Home;
