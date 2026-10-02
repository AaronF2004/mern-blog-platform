import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/posts';

const PRESET_CATEGORIES = [
  'All',
  'Information Technology',
  'Artificial Intelligence',
  'Healthcare',
  'Business & Finance',
  'Engineering & Construction',
  'Education & Training',
  'Career & Jobs',
  'Arts, Media & Communication',
  'Campus Life'
];

const INITIAL_FORM_STATE = {
  title: '',
  author: '',
  category: '',
  imageUrl: '',
  content: ''
};

export default function App() {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readingPost, setReadingPost] = useState(null);
  const [editId, setEditId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [centerAlert, setCenterAlert] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showAlert = (title, message, type = 'success') => {
    setCenterAlert({ title, message, type });
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(API_URL, {
        params: {
          category: selectedCategory,
          search: search.trim() || undefined,
          page: currentPage,
          limit: 6
        }
      });
      if (res.data && Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        // Fallback in case backend returns an unpaginated array
        setPosts(res.data);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn('API fetch failed, check if backend server is running.', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, search, currentPage]);

  useEffect(() => {
    document.body.style.overflow =
      readingPost || isModalOpen || deleteTargetId || centerAlert ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [readingPost, isModalOpen, deleteTargetId, centerAlert]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Resizes and compresses image to lightweight JPEG base64 to avoid MongoDB limits
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress image at 70% quality (typically shrinks file to ~80-150KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditId(null);
    setFormData(INITIAL_FORM_STATE);
    setIsModalOpen(true);
  };

  const handleEdit = (post, e) => {
    e.stopPropagation();
    setEditId(post._id);
    setFormData({
      title: post.title || '',
      author: post.author || '',
      category: post.category || '',
      imageUrl: post.imageUrl || '',
      content: post.content || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      category: formData.category.trim() || 'General'
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, payload);
        showAlert('Article Updated', 'Changes saved successfully to database.', 'success');
      } else {
        await axios.post(API_URL, payload);
        showAlert('Article Published', 'New post successfully published.', 'success');
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.status === 413
          ? 'Image file is too large. Please use a smaller image.'
          : 'Could not connect to the backend server.');
      showAlert('Action Failed', serverMessage, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axios.delete(`${API_URL}/${deleteTargetId}`);
      if (readingPost && readingPost._id === deleteTargetId) setReadingPost(null);
      setDeleteTargetId(null);
      showAlert('Article Deleted', 'The article was permanently deleted.', 'danger');
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      setDeleteTargetId(null);
      showAlert('Delete Failed', 'Could not delete the post from database.', 'danger');
    }
  };

  return (
    <div>
      {/* Toast Alert Dialog */}
      {centerAlert && (
        <div className="center-toast-overlay" onClick={() => setCenterAlert(null)}>
          <div className="center-toast-box" onClick={(e) => e.stopPropagation()}>
            <div className={`toast-icon-circle ${centerAlert.type}`}>
              {centerAlert.type === 'success' ? '✓' : '✕'}
            </div>
            <h4>{centerAlert.title}</h4>
            <p style={{ color: '#64748b', margin: '0.5rem 0 1.25rem' }}>{centerAlert.message}</p>
            <button className="btn-primary" onClick={() => setCenterAlert(null)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <div
            className="logo"
            onClick={() => {
              setSelectedCategory('All');
              setCurrentPage(1);
            }}
          >
            DevPress
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            + Write an Article
          </button>
        </div>
      </header>

      {/* Hero Headline & Search */}
      <section className="hero">
        <div>
          <h2>Articles & Editorial</h2>
          <p style={{ color: '#64748b' }}>Insights, industry news, and technical deep dives</p>
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search articles, authors, topics..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </section>

      {/* Category Chips */}
      <div className="category-chips">
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <main className="posts-grid">
        {posts.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: '1 / -1', padding: '4rem 0', textAlign: 'center' }}>
            No articles found matching criteria.
          </p>
        ) : (
          posts.map((post, idx) => (
            <article key={post._id || idx} className="card" onClick={() => setReadingPost(post)}>
              <img
                src={
                  post.imageUrl && post.imageUrl.trim() !== ''
                    ? post.imageUrl
                    : `https://picsum.photos/seed/${post._id || idx}/700/400`
                }
                alt="Banner"
                className="card-img"
              />
              <div className="card-body">
                <div className="card-header-row">
                  <span className="card-tag">{post.category || 'General'}</span>
                  <span className="read-time">{post.readTime || '2 min read'}</span>
                </div>
                <h3 className="card-title">{post.title}</h3>
                <p className="card-excerpt">{post.excerpt || post.content}</p>
                <div className="card-footer">
                  <div className="author-info">
                    <span className="author-name">{post.author}</span>
                    <span className="post-date">
                      {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="actions">
                    <button className="btn-sm" onClick={(e) => handleEdit(post, e)}>
                      Edit
                    </button>
                    <button
                      className="btn-sm delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(post._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &laquo; Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={currentPage === num ? 'active' : ''}
              onClick={() => setCurrentPage(num)}
            >
              {num}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next &raquo;
          </button>
        </div>
      )}

      {/* Reading View Modal */}
      {readingPost && (
        <div className="modal-overlay" onClick={() => setReadingPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="card-tag">{readingPost.category || 'General'}</span>
              <button className="close-btn" onClick={() => setReadingPost(null)}>
                &times;
              </button>
            </div>
            <img
              src={
                readingPost.imageUrl && readingPost.imageUrl.trim() !== ''
                  ? readingPost.imageUrl
                  : `https://picsum.photos/seed/${readingPost._id}/900/500`
              }
              alt="Banner"
              className="article-detail-img"
            />
            <h1
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: '2.4rem',
                lineHeight: '1.2',
                marginBottom: '0.5rem'
              }}
            >
              {readingPost.title}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              By <strong>{readingPost.author}</strong> •{' '}
              {new Date(readingPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}{' '}
              • {readingPost.readTime || '2 min read'}
            </p>
            <div className="article-content">{readingPost.content}</div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setReadingPost(null)}>
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-overlay" onClick={() => setDeleteTargetId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="toast-icon-circle danger">!</div>
            <h3>Delete Article?</h3>
            <p style={{ color: '#64748b', margin: '0.5rem 0 1.5rem' }}>
              This action cannot be undone. Are you sure you want to permanently delete this post?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn-sm" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Article' : 'Draft New Article'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSubmit}>
              <input
                name="title"
                placeholder="Post title..."
                value={formData.title}
                onChange={handleChange}
                required
              />
              <input
                name="author"
                placeholder="Author name..."
                value={formData.author}
                onChange={handleChange}
                required
              />
              <input
                name="category"
                list="category-options"
                placeholder="Category (e.g. Artificial Intelligence, Healthcare)..."
                value={formData.category}
                onChange={handleChange}
                required
              />
              <datalist id="category-options">
                {PRESET_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              <div className="file-upload-box">
                <label>Select Cover Image:</label>
                <input type="file" accept="image/*" onChange={handleImageFileChange} />
              </div>

              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Selected Preview" className="image-preview" />
              )}

              <textarea
                name="content"
                placeholder="Write your article content..."
                rows="8"
                value={formData.content}
                onChange={handleChange}
                required
              />

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editId
                    ? 'Update Article'
                    : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}