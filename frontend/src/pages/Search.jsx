import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import AuthModal from '../components/AuthModal';

const Search = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicUser, setPublicUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeCommentBlog, setActiveCommentBlog] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [expandedBlogs, setExpandedBlogs] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = async (blog) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${blog.id}`;
    const shareData = {
      title: blog.title,
      text: `${blog.content?.slice(0, 100)}...`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('🔗 Link copied to clipboard!');
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('🔗 Link copied to clipboard!');
    }
  };

  const toggleReadMore = (blogId) => {
    setExpandedBlogs(prev => ({ ...prev, [blogId]: !prev[blogId] }));
  };

  useEffect(() => {
    const user = localStorage.getItem('publicUser');
    if (user) setPublicUser(JSON.parse(user));
    fetchBlogs();
  }, [q]);

  // Scroll to blog from URL param after blogs load
  useEffect(() => {
    if (blogs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId) {
      setTimeout(() => {
        const el = document.getElementById(`blog-${postId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [blogs]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/blogs${q ? `?search=${q}` : ''}`);
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
      const res = await axios.post(`${API_URL}/api/blogs/${blogId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlogs(prev => prev.map(blog => {
        if (blog.id !== blogId) return blog;
        const isLiked = res.data.liked;
        const currentLikes = blog.likes || [];
        return {
          ...blog,
          likes: isLiked
            ? [...currentLikes, { userId: publicUser.id }]
            : currentLikes.filter(l => l.userId !== publicUser.id)
        };
      }));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (e, blogId) => {
    e.preventDefault();
    if (!requireAuth('comment', blogId)) return;
    const text = commentTexts[blogId];
    if (!text?.trim()) return;
    try {
      const token = localStorage.getItem('publicToken');
      const res = await axios.post(`${API_URL}/api/blogs/${blogId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommentTexts(prev => ({ ...prev, [blogId]: '' }));
      setBlogs(prev => prev.map(blog => {
        if (blog.id !== blogId) return blog;
        return { ...blog, comments: [...(blog.comments || []), res.data] };
      }));
    } catch (err) { console.error(err); }
  };



  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="home-layout" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ===== MAIN FEED ===== */}
        <main style={{ width: '100%' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
            Search Results for: <span style={{ color: 'var(--primary-light)' }}>"{q}"</span>
          </h2>
          {blogs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>No posts published yet.</h3>
            </div>
          ) : (
            blogs.map((blog, index) => {
              const isLikedByMe = publicUser && blog.likes?.some(l => l.userId === publicUser.id);
              const likeCount = blog.likes?.length || 0;
              const commentCount = blog.comments?.length || 0;
              const authorName = blog.admin?.displayName || blog.admin?.username || 'Motorist';
              const authorInitial = authorName[0]?.toUpperCase();
              const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              });

              return (
                <div key={blog.id} id={`blog-${blog.id}`} style={{ position: 'relative', marginBottom: '1.5rem', animationDelay: `${index * 0.07}s` }}>
                  {/* Floating Action Bar - Desktop */}
                  <div className="float-actions">
                    <button
                      className={`float-action-btn ${isLikedByMe ? 'liked' : ''}`}
                      onClick={() => handleLike(blog.id)}
                      title="Like"
                    >
                      <Heart size={20} fill={isLikedByMe ? '#ef4444' : 'transparent'} />
                      <span>{likeCount}</span>
                    </button>

                    <button
                      className="float-action-btn"
                      onClick={() => {
                        setActiveCommentBlog(activeCommentBlog === blog.id ? null : blog.id);
                        if (!publicUser) requireAuth('comment', blog.id);
                      }}
                      title="Comments"
                    >
                      <MessageCircle size={20} />
                      <span>{commentCount}</span>
                    </button>

                    <button className="float-action-btn" title="Share" onClick={() => handleShare(blog)}>
                      <Share2 size={20} />
                    </button>

                  </div>

                  {/* Blog Card */}
                  <div className="blog-card blog-card-wrapper">
                    <div className="blog-card-header">

                      {/* LinkedIn-style Post Header: Avatar + Name + Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        {blog.admin?.profilePicture ? (
                          <img
                            src={`${API_URL}${blog.admin.profilePicture}`}
                            alt={authorName}
                            className="author-avatar"
                            style={{ width: '44px', height: '44px', flexShrink: 0 }}
                          />
                        ) : (
                          <div className="author-avatar-placeholder" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>{authorInitial}</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="author-name" style={{ fontSize: '0.95rem' }}>{authorName}</span>
                          </div>
                          <div style={{ display: 'flex', align: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                            <span className="author-role" style={{ fontSize: '0.78rem' }}>Automotive Enthusiast</span>
                            <span style={{ color: 'var(--surface-border)', fontSize: '0.78rem' }}>·</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="blog-title">{blog.title}</h2>

                      {/* LinkedIn-style inline Read More */}
                      <p className="blog-excerpt">
                        {expandedBlogs[blog.id] ? (
                          <>
                            {blog.content}
                            {blog.content?.length > 160 && (
                              <span
                                onClick={() => toggleReadMore(blog.id)}
                                style={{ color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', marginLeft: '4px', whiteSpace: 'nowrap' }}
                              > ...less</span>
                            )}
                          </>
                        ) : (
                          <>
                            {blog.content?.slice(0, 160)}
                            {blog.content?.length > 160 && (
                              <span
                                onClick={() => toggleReadMore(blog.id)}
                                style={{ color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', marginLeft: '4px', whiteSpace: 'nowrap' }}
                              >...more</span>
                            )}
                          </>
                        )}
                      </p>

                    </div>

                    {/* Hero Image */}
                    {blog.imageUrl && (
                      <img
                        src={`${API_URL}${blog.imageUrl}`}
                        alt={blog.title}
                        className="blog-hero-image"
                      />
                    )}

                    {/* Like/Comment count row */}
                    <div className="stat-row" style={{ paddingTop: '0.8rem' }}>
                      <span>♥ {likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                      <span>💬 {commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
                    </div>


                    {/* Mobile Inline Actions */}
                    <div className="inline-actions">
                      <button
                        className={`inline-action-btn ${isLikedByMe ? 'liked' : ''}`}
                        onClick={() => handleLike(blog.id)}
                      >
                        <Heart size={20} fill={isLikedByMe ? '#ef4444' : 'transparent'} />
                        {likeCount}
                      </button>
                      <button
                        className="inline-action-btn"
                        onClick={() => {
                          setActiveCommentBlog(activeCommentBlog === blog.id ? null : blog.id);
                          if (!publicUser) requireAuth('comment', blog.id);
                        }}
                      >
                        <MessageCircle size={20} />
                        {commentCount}
                      </button>
                      <button className="inline-action-btn" onClick={() => handleShare(blog)}>
                        <Share2 size={20} />
                        Share
                      </button>
                    </div>

                    {/* Comments Section */}
                    {activeCommentBlog === blog.id && (
                      <div style={{ borderTop: '1px solid var(--surface-border)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.25s ease' }}>

                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                          </span>
                          <span
                            onClick={() => setActiveCommentBlog(null)}
                            style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600' }}
                          >Hide ✕</span>
                        </div>

                        {/* Comment List */}
                        {blog.comments?.map(comment => {
                          const userInitial = comment.user?.name?.[0]?.toUpperCase() || '?';
                          const adminName = blog.admin?.displayName || blog.admin?.username || 'Motorist';
                          const adminInitial = adminName[0]?.toUpperCase();
                          return (
                            <div key={comment.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                              {/* User Avatar */}
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '700', flexShrink: 0, border: '2px solid var(--surface-border)' }}>
                                {userInitial}
                              </div>

                              {/* Comment Bubble */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ background: 'var(--surface-2)', borderRadius: '0 12px 12px 12px', padding: '0.7rem 1rem' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)', marginRight: '0.5rem' }}>{comment.user?.name}</span>
                                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: '1.5' }}>{comment.text}</p>
                                </div>

                                {/* Admin Reply */}
                                {comment.adminReply && (
                                  <div style={{ marginTop: '0.6rem' }}>
                                    {!expandedReplies[comment.id] ? (
                                      <span
                                        onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: true }))}
                                        style={{ fontSize: '0.75rem', color: 'var(--primary-light)', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                      >
                                        💬 View reply from {adminName}
                                      </span>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', animation: 'fadeIn 0.2s ease' }}>
                                        {/* Admin Avatar */}
                                        {blog.admin?.profilePicture ? (
                                          <img src={`${API_URL}${blog.admin.profilePicture}`} alt={adminName} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--primary)' }} />
                                        ) : (
                                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0, border: '2px solid var(--primary)' }}>
                                            {adminInitial}
                                          </div>
                                        )}
                                        <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '0 12px 12px 12px', padding: '0.6rem 0.9rem', flex: 1 }}>
                                          <span style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--primary-light)', marginRight: '0.4rem' }}>{adminName}</span>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(124,58,237,0.15)', padding: '0.1rem 0.4rem', borderRadius: '8px', fontWeight: '600' }}>Author</span>
                                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: '1.5' }}>{comment.adminReply}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div style={{ borderTop: '1px solid var(--surface-border)', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Current user avatar */}
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: publicUser ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--surface-2)', border: '2px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: '700', flexShrink: 0 }}>
                        {publicUser ? publicUser.name?.[0]?.toUpperCase() : '?'}
                      </div>
                      <form onSubmit={(e) => handleComment(e, blog.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface-2)', borderRadius: '24px', border: '1px solid var(--surface-border)', padding: '0.45rem 0.45rem 0.45rem 1rem', gap: '0.5rem', transition: 'border-color 0.2s' }}
                        onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                      >
                        <input
                          id={`comment-input-${blog.id}`}
                          type="text"
                          value={commentTexts[blog.id] || ''}
                          onChange={(e) => setCommentTexts(prev => ({ ...prev, [blog.id]: e.target.value }))}
                          placeholder={publicUser ? `Comment as ${publicUser.name}...` : 'Login to comment...'}
                          autoComplete="off"
                          onClick={() => { if (!publicUser) requireAuth('comment', blog.id); }}
                          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}
                        />
                        <button
                          type="submit"
                          disabled={!(commentTexts[blog.id] || '').trim()}
                          style={{ background: (commentTexts[blog.id] || '').trim() ? 'var(--primary)' : 'var(--surface)', border: 'none', borderRadius: '20px', color: 'white', cursor: (commentTexts[blog.id] || '').trim() ? 'pointer' : 'default', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: '700', padding: '0.4rem 0.9rem', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
                        >
                          Post
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>


      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialName={publicUser?.name || ''}
        initialPhone={publicUser?.phoneNumber || ''}
      />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
          border: '1px solid var(--primary)',
          color: 'var(--text-primary)',
          padding: '0.75rem 1.5rem',
          borderRadius: '24px',
          fontWeight: '600',
          fontSize: '0.9rem',
          boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap'
        }}>
          {toast}
        </div>
      )}
    </>
  );
};

export default Search;
