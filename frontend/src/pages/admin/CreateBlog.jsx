import { API_URL } from '../../config';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateBlog = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(``, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to publish blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '2rem' }}>Write a New Blog</h1>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Blog Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g., Top 10 SUVs in 2026"
            />
          </div>
          


          <div className="form-group">
            <label className="form-label">Cover Image</label>
            <input 
              type="file" 
              className="form-input" 
              onChange={(e) => setImage(e.target.files[0])}
              accept="image/*"
            />
          </div>

          <div className="form-group mb-8">
            <label className="form-label">Blog Content</label>
            <textarea 
              className="form-input form-textarea" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Write your amazing article here..."
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Publish Blog Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
