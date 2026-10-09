import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api/posts'
    : 'https://mern-blog-platform-4elw.onrender.com/api/posts';

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

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [readingPost, setReadingPost] = useState(null);
  const [editId, setEditId] = useState(null);

  // Status & Modal Popups
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteCommentTargetId, setDeleteCommentTargetId] = useState(null);
  const [centerAlert, setCenterAlert] = useState(null);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('devpress_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Hidden Administrative Gateway (Accessible via Ctrl+Shift+A or #admin-portal)
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [adminPortalKey, setAdminPortalKey] = useState('');

  // Liked Posts Tracker
  const [likedPosts, setLikedPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('devpress_liked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Bookmarked Posts Tracker
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(() => {
    try {
      const saved = localStorage.getItem('devpress_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reading Progress Bar State
  const [scrollProgress, setScrollProgress] = useState(0);
  const articleModalRef = useRef(null);

  // Post Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    imageUrl: '',
    content: '',
    status: 'published'
  });
  const textareaRef = useRef(null);

  // Comments State
  const [commentText, setCommentText] = useState('');
  const [replyParentId, setReplyParentId] = useState(null);
  const commentInputRef = useRef(null);

  const showAlert = (title, message, type = 'success') => {
    setCenterAlert({ title, message, type });
  };

  const closeAlert = () => {
    setCenterAlert(null);
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('devpress_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Strictly checks whether the current logged-in user created the post
  const isAuthorOfPost = (post) => {
    if (!currentUser || !post) return false;
    const currentUserId = currentUser.id || currentUser._id;
    if (
      post.authorId &&
      (post.authorId === currentUserId || post.authorId.toString() === currentUserId.toString())
    ) {
      return true;
    }
    if (post.author && currentUser.name) {
      return post.author.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
    }
    return false;
  };

  // Strictly checks whether the current logged-in user created the specific review/comment
  const isAuthorOfComment = (comment) => {
    if (!currentUser || !comment) return false;
    const currentUserId = currentUser.id || currentUser._id;
    if (
      comment.authorId &&
      (comment.authorId === currentUserId || comment.authorId.toString() === currentUserId.toString())
    ) {
      return true;
    }
    if (comment.author && currentUser.name) {
      return comment.author.toLowerCase().trim() === currentUser.name.toLowerCase().trim();
    }
    return false;
  };

  // Delete permission: PLATFORM ADMIN CAN DELETE ANY ARTICLE UNCONDITIONALLY, or Author
  const canDeletePost = (post) => {
    if (!currentUser || !post) return false;
    if (currentUser.role === 'admin') return true;
    return isAuthorOfPost(post);
  };

  const getDisplayAuthor = (post) => {
    if (post.author && post.author.trim() !== '' && post.author !== 'Anonymous') {
      return post.author;
    }
    if (currentUser && isAuthorOfPost(post)) {
      return currentUser.name;
    }
    return post.author || 'Author';
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (Array.isArray(res.data)) {
        const sanitized = res.data.map((p) => ({
          ...p,
          views: Number(p.views) >= 0 ? Number(p.views) : 0
        }));
        setPosts(sanitized);
        localStorage.setItem('mern_cached_posts', JSON.stringify(sanitized));
      }
    } catch (err) {
      console.warn('Backend unavailable, checking cache.');
      const cached = localStorage.getItem('mern_cached_posts');
      if (cached) {
        setPosts(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Admin Gateway Shortcut: Ctrl + Shift + A or Hash #admin-portal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminPortalOpen(true);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin-portal') {
        setIsAdminPortalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin-portal') {
      setIsAdminPortalOpen(true);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (
      readingPost ||
      isModalOpen ||
      deleteTargetId ||
      deleteCommentTargetId ||
      centerAlert ||
      isAuthModalOpen ||
      isAdminPortalOpen
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [
    readingPost,
    isModalOpen,
    deleteTargetId,
    deleteCommentTargetId,
    centerAlert,
    isAuthModalOpen,
    isAdminPortalOpen
  ]);

  useEffect(() => {
    if (readingPost) {
      setTimeout(() => {
        Prism.highlightAll();
      }, 50);
    }
  }, [readingPost]);

  const handleArticleScroll = () => {
    if (articleModalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = articleModalRef.current;
      const totalScroll = scrollHeight - clientHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / totalScroll) * 100));
        setScrollProgress(progress);
      }
    }
  };

  const openReadingModal = async (post) => {
    const currentCount = Number(post.views) >= 0 ? Number(post.views) : 0;
    const nextCount = currentCount + 1;

    setReadingPost({ ...post, views: nextCount });
    setScrollProgress(0);

    setPosts((prevPosts) => {
      const updated = prevPosts.map((p) =>
        p._id === post._id ? { ...p, views: nextCount } : p
      );
      localStorage.setItem('mern_cached_posts', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await axios.patch(`${API_URL}/${post._id}/view`);
      if (res.data && typeof res.data.views === 'number') {
        const confirmedViews = Number(res.data.views);
        setReadingPost((prev) => (prev && prev._id === post._id ? { ...prev, views: confirmedViews } : prev));
        setPosts((prevPosts) => {
          const synced = prevPosts.map((p) =>
            p._id === post._id ? { ...p, views: confirmedViews } : p
          );
          localStorage.setItem('mern_cached_posts', JSON.stringify(synced));
          return synced;
        });
      }
    } catch (err) {
      console.error('Failed to sync views counter to MongoDB:', err);
    }
  };

  const toggleBookmark = (postId, e) => {
    if (e) e.stopPropagation();
    const isBookmarked = bookmarkedPostIds.includes(postId);
    const updated = isBookmarked
      ? bookmarkedPostIds.filter((id) => id !== postId)
      : [...bookmarkedPostIds, postId];

    setBookmarkedPostIds(updated);
    localStorage.setItem('devpress_bookmarks', JSON.stringify(updated));
    showAlert(
      isBookmarked ? 'Bookmark Removed' : 'Article Saved',
      isBookmarked ? 'Article removed from your reading list.' : 'Article saved to your Bookmarks list.'
    );
  };

  const handleAuthInputChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
    setAuthError('');
  };

  const toggleAuthMode = () => {
    setIsLoginView(!isLoginView);
    setAuthError('');
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isLoginView ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload = isLoginView
      ? { email: authForm.email, password: authForm.password }
      : {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password
        };

    try {
      const res = await axios.post(endpoint, payload);
      if (res.data && res.data.token) {
        localStorage.setItem('devpress_token', res.data.token);
        localStorage.setItem('devpress_user', JSON.stringify(res.data.user));
        setCurrentUser(res.data.user);
        setIsAuthModalOpen(false);
        setAuthForm({ name: '', email: '', password: '' });
        showAlert(
          isLoginView ? 'Welcome Back!' : 'Account Created!',
          `Signed in as ${res.data.user.name}.`,
          'success'
        );
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminGatewayVerify = async (e) => {
    e.preventDefault();
    if (!adminPortalKey.trim()) return;

    if (!currentUser) {
      showAlert('Login Required', 'Please sign in to your author account first before claiming Admin privileges.', 'danger');
      setIsAdminPortalOpen(false);
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/auth/claim-admin`,
        { adminSecret: adminPortalKey.trim() },
        { headers: getAuthHeader() }
      );

      localStorage.setItem('devpress_token', res.data.token);
      localStorage.setItem('devpress_user', JSON.stringify(res.data.user));
      setCurrentUser(res.data.user);
      setIsAdminPortalOpen(false);
      setAdminPortalKey('');
      if (window.location.hash === '#admin-portal') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      showAlert('Admin Granted', 'Administrative access authorized successfully.', 'success');
    } catch (err) {
      showAlert('Unauthorized', err.response?.data?.message || 'Invalid administrative credentials.', 'danger');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('devpress_token');
    localStorage.removeItem('devpress_user');
    setCurrentUser(null);
    showAlert('Signed Out', 'You have been logged out.', 'danger');
  };

  const insertFormatting = (tagStart, tagEnd = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = tagStart + selected + tagEnd;

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const uploadImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Invalid File', 'Please select an image file (JPG, PNG, WEBP).', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert('File Too Large', 'Please select an image smaller than 5MB.', 'danger');
      return;
    }

    showAlert('Uploading...', 'Processing cover image...', 'success');

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await axios.post(`${API_URL}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
        showAlert('Image Uploaded', 'Cover image uploaded to Cloudinary successfully!', 'success');
        return;
      }
    } catch (err) {
      console.warn('Cloudinary upload fallback activated:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
        showAlert('Image Attached', 'Cover image attached successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleGenerateMagicBanner = () => {
    const topic = formData.category.trim() || formData.title.trim() || 'technology';
    const cleanTopic = encodeURIComponent(topic.split(' ')[0]);
    const randomSeed = Math.floor(Math.random() * 9999);
    const magicUrl = `https://picsum.photos/seed/${cleanTopic}-${randomSeed}/1200/600`;

    setFormData((prev) => ({ ...prev, imageUrl: magicUrl }));
    showAlert('Banner Generated', 'Topic-matched high-res cover assigned!', 'success');
  };

  const openCreateModal = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditId(null);
    setFormData({
      title: '',
      author: currentUser.name,
      category: '',
      imageUrl: '',
      content: '',
      status: 'published'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (post, e) => {
    e.stopPropagation();
    if (!isAuthorOfPost(post)) {
      showAlert('Access Denied', 'Only the author who created this article can edit it.', 'danger');
      return;
    }
    setEditId(post._id);
    setFormData({
      title: post.title,
      author: post.author || currentUser.name,
      category: post.category || '',
      imageUrl: post.imageUrl || '',
      content: post.content,
      status: post.status || 'published'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (targetStatus = 'published', e) => {
    if (e) e.preventDefault();
    const finalCategory = formData.category.trim() || 'Information Technology';
    const authorName = currentUser?.name || formData.author?.trim() || 'Author';

    const payload = {
      title: formData.title.trim(),
      author: authorName,
      category: finalCategory,
      imageUrl: formData.imageUrl.trim(),
      content: formData.content.trim(),
      status: targetStatus
    };

    try {
      if (editId) {
        const res = await axios.put(`${API_URL}/${editId}`, payload, {
          headers: getAuthHeader()
        });
        const updatedPost = {
          ...res.data,
          views: Number(res.data.views) >= 0 ? Number(res.data.views) : 0
        };

        setPosts((prevPosts) => {
          const updated = prevPosts.map((p) => (p._id === editId ? updatedPost : p));
          localStorage.setItem('mern_cached_posts', JSON.stringify(updated));
          return updated;
        });

        setIsModalOpen(false);
        showAlert('Article Updated', 'Your changes have been saved.', 'success');
      } else {
        const res = await axios.post(API_URL, payload, {
          headers: getAuthHeader()
        });
        const createdPost = {
          ...res.data,
          views: Number(res.data.views) >= 0 ? Number(res.data.views) : 0
        };

        setPosts((prevPosts) => {
          const updated = [createdPost, ...prevPosts];
          localStorage.setItem('mern_cached_posts', JSON.stringify(updated));
          return updated;
        });

        setIsModalOpen(false);
        showAlert(
          targetStatus === 'draft' ? 'Draft Saved' : 'Article Published',
          targetStatus === 'draft'
            ? 'Your article has been saved as a private draft.'
            : 'Your article is now live on the homepage.',
          'success'
        );
      }
    } catch (err) {
      console.error('Error saving post:', err);
      showAlert(
        'Action Failed',
        err.response?.data?.error || err.response?.data?.message || 'Could not save the article.',
        'danger'
      );
    }
  };

  const promptDelete = (post, e) => {
    if (e) e.stopPropagation();
    if (!canDeletePost(post)) {
      showAlert('Access Denied', 'Only the original author or an admin can delete this article.', 'danger');
      return;
    }
    setDeleteTargetId(post._id);
  };

  // ADMIN OR AUTHOR DELETE HANDLER
  const confirmDelete = async (e) => {
    if (e) e.stopPropagation();
    if (!deleteTargetId) return;

    try {
      const res = await axios.delete(`${API_URL}/${deleteTargetId}`, {
        headers: getAuthHeader()
      });

      const updated = posts.filter((p) => p._id !== deleteTargetId);
      setPosts(updated);
      localStorage.setItem('mern_cached_posts', JSON.stringify(updated));

      if (readingPost && readingPost._id === deleteTargetId) {
        setReadingPost(null);
      }

      setDeleteTargetId(null);
      showAlert(
        'Article Deleted',
        res.data?.message || 'The article was permanently removed from the platform.',
        'danger'
      );
    } catch (err) {
      console.error('Error deleting post:', err);
      showAlert(
        'Delete Failed',
        err.response?.data?.error || err.response?.data?.message || 'Could not delete the post.',
        'danger'
      );
      setDeleteTargetId(null);
    }
  };

  const handleLikeToggle = async (postId, e) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedPosts.includes(postId);
    const delta = isCurrentlyLiked ? -1 : 1;

    const nextLiked = isCurrentlyLiked
      ? likedPosts.filter((id) => id !== postId)
      : [...likedPosts, postId];

    setLikedPosts(nextLiked);
    localStorage.setItem('devpress_liked', JSON.stringify(nextLiked));

    const updatedPosts = posts.map((p) => {
      if (p._id === postId) {
        const currentCount = typeof p.likes === 'number' ? p.likes : (p.claps || 0);
        const newCount = Math.max(0, currentCount + delta);
        return { ...p, likes: newCount, claps: newCount };
      }
      return p;
    });

    setPosts(updatedPosts);
    localStorage.setItem('mern_cached_posts', JSON.stringify(updatedPosts));

    if (readingPost && readingPost._id === postId) {
      const currentCount = typeof readingPost.likes === 'number' ? readingPost.likes : (readingPost.claps || 0);
      const newCount = Math.max(0, currentCount + delta);
      setReadingPost((prev) => ({ ...prev, likes: newCount, claps: newCount }));
    }

    try {
      const res = await axios.patch(`${API_URL}/${postId}/like`, { delta });
      if (res.data) {
        const confirmedCount =
          typeof res.data.likes === 'number' ? res.data.likes : res.data.claps;

        setPosts((prev) => {
          const synced = prev.map((p) =>
            p._id === postId ? { ...p, likes: confirmedCount, claps: confirmedCount } : p
          );
          localStorage.setItem('mern_cached_posts', JSON.stringify(synced));
          return synced;
        });
      }
    } catch (err) {
      console.error('Like database sync error:', err);
      setLikedPosts(likedPosts);
      localStorage.setItem('devpress_liked', JSON.stringify(likedPosts));
      fetchPosts();
    }
  };

  const handleReplyClick = (parentId, e) => {
    if (e) e.stopPropagation();
    setReplyParentId(parentId);

    if (commentInputRef.current) {
      commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentInputRef.current.focus();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText || !commentText.trim()) {
      showAlert('Empty Comment', 'Please enter some text before posting your comment.', 'danger');
      if (commentInputRef.current) commentInputRef.current.focus();
      return;
    }

    const authorName = currentUser ? currentUser.name : 'Guest Reader';
    const authorId = currentUser ? (currentUser.id || currentUser._id) : null;

    try {
      const res = await axios.post(`${API_URL}/${readingPost._id}/comments`, {
        author: authorName,
        authorId: authorId,
        content: commentText.trim(),
        parentId: replyParentId
      });
      setReadingPost((prev) => ({ ...prev, comments: res.data }));
      setPosts((prev) => {
        const synced = prev.map((p) => (p._id === readingPost._id ? { ...p, comments: res.data } : p));
        localStorage.setItem('mern_cached_posts', JSON.stringify(synced));
        return synced;
      });
      setCommentText('');
      setReplyParentId(null);
    } catch (err) {
      showAlert('Comment Failed', 'Could not post your reply.', 'danger');
    }
  };

  const promptDeleteComment = (comment, e) => {
    if (e) e.stopPropagation();
    if (!isAuthorOfComment(comment)) {
      showAlert('Access Denied', 'Only the user who created this review can delete it.', 'danger');
      return;
    }
    setDeleteCommentTargetId(comment._id);
  };

  const confirmDeleteComment = async (e) => {
    if (e) e.stopPropagation();
    if (!deleteCommentTargetId || !readingPost) return;

    try {
      const res = await axios.delete(
        `${API_URL}/${readingPost._id}/comments/${deleteCommentTargetId}`,
        {
          headers: getAuthHeader()
        }
      );

      setReadingPost((prev) => ({ ...prev, comments: res.data }));
      setPosts((prev) => {
        const synced = prev.map((p) => (p._id === readingPost._id ? { ...p, comments: res.data } : p));
        localStorage.setItem('mern_cached_posts', JSON.stringify(synced));
        return synced;
      });

      setDeleteCommentTargetId(null);
      showAlert('Review Deleted', 'Your review and discussion replies have been removed.');
    } catch (err) {
      console.error('Delete comment failed:', err);
      setDeleteCommentTargetId(null);
      showAlert('Error', err.response?.data?.message || 'Could not delete review.', 'danger');
    }
  };

  const handleCopyLink = (post) => {
    const slugOrId = post.slug || post._id;
    const url = `${window.location.origin}/#${slugOrId}`;
    navigator.clipboard.writeText(url);
    showAlert('Link Copied', 'Clean article link copied to clipboard!');
  };

  const filteredPosts = posts
    .filter((post) => {
      if (post.status === 'draft' && !isAuthorOfPost(post) && currentUser?.role !== 'admin') {
        return false;
      }

      const displayAuthor = getDisplayAuthor(post);
      const matchesSearch =
        post.title?.toLowerCase().includes(search.toLowerCase()) ||
        displayAuthor.toLowerCase().includes(search.toLowerCase()) ||
        post.content?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Bookmarks'
          ? bookmarkedPostIds.includes(post._id)
          : post.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'mostViewed') return (Number(b.views) || 0) - (Number(a.views) || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  return (
    <div>
      {/* 1. Centered Status Dialog */}
      {centerAlert && (
        <div className="center-toast-overlay" onClick={closeAlert}>
          <div className="center-toast-box" onClick={(e) => e.stopPropagation()}>
            <div className={`toast-icon-circle ${centerAlert.type}`}>
              {centerAlert.type === 'success' ? '✓' : '✕'}
            </div>
            <h4>{centerAlert.title}</h4>
            <p>{centerAlert.message}</p>
            <button className="btn-primary" onClick={closeAlert}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => setSelectedCategory('All')}>
            Dev<span>Press</span>
          </div>
          <div className="auth-actions">
            {currentUser ? (
              <>
                <span
                  className="user-badge"
                  style={currentUser.role === 'admin' ? { background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' } : {}}
                  title={currentUser.role === 'admin' ? "Platform Administrator" : "Author Account"}
                >
                  {currentUser.role === 'admin' ? '🛡️ Admin' : `👤 ${currentUser.name}`}
                </span>
                <button className="btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button
                className="btn-sm"
                onClick={() => {
                  setAuthError('');
                  setIsAuthModalOpen(true);
                }}
              >
                Sign In
              </button>
            )}
            <button className="btn-primary" onClick={openCreateModal}>
              + Write
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero, Search & Sort Filter */}
      <section className="hero">
        <div>
          <h2>Articles & Editorial</h2>
          <p>Insights, industry news, and guides</p>
        </div>

        <div className="hero-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">📅 Newest</option>
            <option value="oldest">⏳ Oldest</option>
            <option value="mostViewed">🔥 Most Viewed</option>
          </select>
        </div>
      </section>

      {/* 4. Category Filter Chips */}
      <div className="category-chips-wrapper">
        <div className="category-chips">
          <button
            className={`chip saved-chip ${selectedCategory === 'Bookmarks' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('Bookmarks')}
          >
            🔖 Bookmarks ({bookmarkedPostIds.length})
          </button>

          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Synchronized Grid or Loading Spinner */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : (
        <main className="posts-grid">
          {filteredPosts.length === 0 ? (
            <p style={{ color: '#94a3b8', gridColumn: '1 / -1', padding: '3rem 0', textAlign: 'center' }}>
              {selectedCategory === 'Bookmarks'
                ? 'You have not saved any articles yet. Click the ribbon icon on any post to bookmark it!'
                : 'No articles found matching your criteria.'}
            </p>
          ) : (
            filteredPosts.map((post, idx) => {
              const isAdmin = currentUser?.role === 'admin';
              const isAuthor = isAuthorOfPost(post);
              const hasDeleteRights = canDeletePost(post);
              const isLiked = likedPosts.includes(post._id);
              const isSaved = bookmarkedPostIds.includes(post._id);
              const displayLikes = typeof post.likes === 'number' ? post.likes : (post.claps || 0);
              const displayAuthorName = getDisplayAuthor(post);

              return (
                <article
                  key={post._id || idx}
                  className="card"
                  onClick={() => openReadingModal(post)}
                >
                  <div className="card-img-wrapper">
                    <img
                      src={
                        post.imageUrl && post.imageUrl.trim() !== ''
                          ? post.imageUrl
                          : `https://picsum.photos/seed/${post._id || idx}/700/400`
                      }
                      alt="Banner"
                      className="card-img"
                    />

                    <div className="views-badge" title={`${Number(post.views) || 0} views`}>
                      <svg viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      <span>{Number(post.views) || 0}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-tag-row">
                      <span className="card-tag">{post.category || 'General'}</span>
                      {post.status === 'draft' && <span className="draft-badge">Draft</span>}
                    </div>

                    <h3 className="card-title">{post.title}</h3>
                    <p className="card-excerpt">{post.content.replace(/<[^>]*>/g, '')}</p>
                    
                    <div className="card-footer">
                      <div className="author-info">
                        <span className="author-name">{displayAuthorName}</span>
                        <span className="post-date">
                          {post.readTime || 1} min read •{' '}
                          {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="actions">
                        <button
                          className={`btn-bookmark ${isSaved ? 'bookmarked' : ''}`}
                          title={isSaved ? 'Remove Bookmark' : 'Save for Later'}
                          onClick={(e) => toggleBookmark(post._id, e)}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                          </svg>
                        </button>

                        <button
                          className={`wp-clap-pill ${isLiked ? 'clapped' : ''}`}
                          title={isLiked ? 'Unlike' : 'Like'}
                          onClick={(e) => handleLikeToggle(post._id, e)}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{displayLikes}</span>
                        </button>

                        {/* EDIT BUTTON: ONLY TO THE AUTHOR WHO CREATED IT */}
                        {isAuthor && (
                          <button
                            className="btn-sm"
                            title="Edit your article"
                            onClick={(e) => handleEdit(post, e)}
                          >
                            Edit
                          </button>
                        )}

                        {/* DELETE BUTTON: Visible to Author, OR to Admin (as Admin Delete) */}
                        {hasDeleteRights && (
                          <button
                            className="btn-sm delete"
                            title={isAdmin && !isAuthor ? "Delete as Admin" : "Delete article"}
                            onClick={(e) => promptDelete(post, e)}
                          >
                            {isAdmin && !isAuthor ? '🛡️ Admin Delete' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>
      )}

      {/* 6. Centered Delete Article Confirmation Popup */}
      {deleteTargetId && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setDeleteTargetId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <h3>Delete Article?</h3>
            <p>
              {currentUser?.role === 'admin'
                ? 'As an Administrator, this action will permanently remove this article from the platform.'
                : 'Are you sure you want to permanently delete your article? This cannot be undone.'}
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-sm"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Centered Delete Comment Confirmation Popup */}
      {deleteCommentTargetId && (
        <div
          className="modal-overlay"
          style={{ zIndex: 9999 }}
          onClick={() => setDeleteCommentTargetId(null)}
        >
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <h3>Delete Review?</h3>
            <p>
              Are you sure you want to delete your review? Any replies attached to this discussion will also be removed.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-sm"
                onClick={() => setDeleteCommentTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDeleteComment}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Centered Reading View Modal */}
      {readingPost && (
        <div className="modal-overlay" onClick={() => setReadingPost(null)}>
          <div
            className="modal-content"
            ref={articleModalRef}
            onScroll={handleArticleScroll}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reading-progress-track">
              <div
                className="reading-progress-fill"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            <div className="modal-header">
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span className="card-tag">{readingPost.category || 'General'}</span>
                {readingPost.status === 'draft' && <span className="draft-badge">Draft</span>}
              </div>
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
              alt="Article Banner"
              className="article-detail-img"
            />
            
            <h1 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', lineHeight: '1.25' }}>
              {readingPost.title}
            </h1>
            
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
              By <strong>{getDisplayAuthor(readingPost)}</strong> • {readingPost.readTime || 1} min read • 👁️ {Number(readingPost.views) || 0} views •{' '}
              {new Date(readingPost.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>

            <div className="social-share-row">
              <span className="share-label">Share:</span>
              
              <a
                className="share-icon-btn whatsapp"
                title="Share on WhatsApp"
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  readingPost.title + ' - Read here: ' + window.location.href
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.04C9.33 7.04 9 7.12 8.71 7.43C8.42 7.74 7.6 8.5 7.6 10.06C7.6 11.62 8.74 13.12 8.9 13.33C9.06 13.54 11.13 16.73 14.3 18.1C15.06 18.42 15.65 18.62 16.11 18.77C16.87 19.01 17.57 18.97 18.12 18.89C18.73 18.8 20 18.12 20.26 17.39C20.52 16.03 20.44 15.9C20.36 15.77 20.16 15.69 19.85 15.54C19.55 15.38 18.06 14.65 17.78 14.55C17.5 14.45 17.3 14.4 17.1 14.71C16.9 15.01 16.32 15.69 16.15 15.9C15.97 16.1 15.8 16.13 15.5 15.98C15.19 15.82 14.21 15.5 13.04 14.46C12.13 13.65 11.52 12.65 11.34 12.35C11.17 12.04 11.32 11.88 11.48 11.72C11.61 11.59 11.78 11.37 11.93 11.19C12.09 11.01 12.14 10.88 12.24 10.68C12.34 10.47 12.29 10.3 12.22 10.15C12.14 10.88 12.24 10.68 12.24 10.68Z" />
                </svg>
              </a>

              <a
                className="share-icon-btn x-twitter"
                title="Share on X"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  readingPost.title
                )}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                className="share-icon-btn linkedin"
                title="Share on LinkedIn"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  window.location.href
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.95 0-1.72.78-1.72 1.73s.77 1.73 1.72 1.73 1.73-.78 1.73-1.73-.78-1.73-1.73Z" />
                </svg>
              </a>

              <button
                type="button"
                className="share-btn-copy"
                title="Copy Link"
                onClick={() => handleCopyLink(readingPost)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>

            <div className="article-content">
              {readingPost.content.split('```').map((chunk, index) => {
                if (index % 2 === 1) {
                  return (
                    <div key={index} className="code-block-container">
                      <button
                        type="button"
                        className="btn-copy-code"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(chunk.trim());
                          showAlert('Copied!', 'Code copied to clipboard.');
                        }}
                      >
                        📋 Copy
                      </button>
                      <pre className="language-javascript">
                        <code>{chunk.trim()}</code>
                      </pre>
                    </div>
                  );
                }
                return <p key={index}>{chunk}</p>;
              })}
            </div>

            <div className="engagement-bar">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className={`wp-clap-pill ${likedPosts.includes(readingPost._id) ? 'clapped' : ''}`}
                  title={likedPosts.includes(readingPost._id) ? 'Unlike' : 'Like'}
                  onClick={(e) => handleLikeToggle(readingPost._id, e)}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>
                    {typeof readingPost.likes === 'number' ? readingPost.likes : (readingPost.claps || 0)}
                  </span>
                </button>

                <button
                  className={`btn-bookmark ${bookmarkedPostIds.includes(readingPost._id) ? 'bookmarked' : ''}`}
                  onClick={(e) => toggleBookmark(readingPost._id, e)}
                  title="Bookmark Article"
                  style={{ width: '36px', height: '36px' }}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                  </svg>
                </button>
              </div>

              {/* Reading View Actions */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {isAuthorOfPost(readingPost) && (
                  <button className="btn-sm" onClick={(e) => handleEdit(readingPost, e)}>
                    Edit
                  </button>
                )}
                {canDeletePost(readingPost) && (
                  <button className="btn-sm delete" onClick={(e) => promptDelete(readingPost, e)}>
                    {currentUser?.role === 'admin' && !isAuthorOfPost(readingPost)
                      ? '🛡️ Admin Delete'
                      : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            {/* Creative Discussion & Threaded Reviews Section */}
            <div className="creative-discussion">
              <div className="discussion-header">
                <h3>Discussion</h3>
                <span className="comment-count-badge">
                  {readingPost.comments?.length || 0}
                </span>
              </div>

              <form onSubmit={handleAddComment} noValidate className="comment-input-card">
                {replyParentId && (
                  <div className="reply-badge">
                    <span>↳ Replying to comment...</span>
                    <button type="button" onClick={() => setReplyParentId(null)}>
                      (Cancel)
                    </button>
                  </div>
                )}
                <textarea
                  ref={commentInputRef}
                  placeholder={
                    currentUser
                      ? `What are your thoughts, ${currentUser.name}?`
                      : 'Share your thoughts...'
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="comment-input-footer">
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Be respectful.
                  </span>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    Post Comment
                  </button>
                </div>
              </form>

              <div className="comments-list">
                {!readingPost.comments || readingPost.comments.length === 0 ? (
                  <p
                    style={{
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '1rem'
                    }}
                  >
                    No comments yet. Start the conversation!
                  </p>
                ) : (
                  readingPost.comments
                    ?.filter((c) => !c.parentId)
                    .map((parent) => {
                      const canDeleteReview = isAuthorOfComment(parent);

                      return (
                        <div key={parent._id} className="comment-node">
                          <div className="creative-comment">
                            <div className="comment-meta">
                              <div className="comment-author-group">
                                <div className="comment-avatar">
                                  {parent.author ? parent.author[0] : 'U'}
                                </div>
                                <div>
                                  <span className="comment-author-name">{parent.author}</span>
                                  {parent.author?.toLowerCase().trim() === readingPost.author?.toLowerCase().trim() && (
                                    <span className="author-chip" style={{ marginLeft: '0.3rem' }}>
                                      Author
                                    </span>
                                  )}
                                  <div className="comment-date">
                                    {new Date(parent.createdAt || Date.now()).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div className="comment-controls">
                                <button
                                  type="button"
                                  className="btn-reply-link"
                                  onClick={(e) => handleReplyClick(parent._id, e)}
                                >
                                  Reply
                                </button>

                                {canDeleteReview && (
                                  <button
                                    type="button"
                                    className="btn-delete-comment"
                                    title="Delete your review"
                                    onClick={(e) => promptDeleteComment(parent, e)}
                                  >
                                    <svg viewBox="0 0 24 24">
                                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="comment-body-text">{parent.content}</p>
                          </div>

                          {readingPost.comments
                            ?.filter((c) => c.parentId === parent._id)
                            .map((reply) => {
                              const canDeleteReply = isAuthorOfComment(reply);

                              return (
                                <div key={reply._id} className="creative-comment is-reply">
                                  <div className="comment-meta">
                                    <div className="comment-author-group">
                                      <div
                                        className="comment-avatar"
                                        style={{ width: '24px', height: '24px', fontSize: '0.68rem' }}
                                      >
                                        {reply.author ? reply.author[0] : 'U'}
                                      </div>
                                      <div>
                                        <span className="comment-author-name">{reply.author}</span>
                                        {reply.author?.toLowerCase().trim() === readingPost.author?.toLowerCase().trim() && (
                                          <span className="author-chip" style={{ marginLeft: '0.3rem' }}>
                                            Author
                                          </span>
                                        )}
                                        <div className="comment-date">
                                          {new Date(reply.createdAt || Date.now()).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="comment-controls">
                                      <button
                                        type="button"
                                        className="btn-reply-link"
                                        onClick={(e) => handleReplyClick(parent._id, e)}
                                      >
                                        Reply
                                      </button>

                                      {canDeleteReply && (
                                        <button
                                          type="button"
                                          className="btn-delete-comment"
                                          title="Delete your reply"
                                          onClick={(e) => promptDeleteComment(reply, e)}
                                        >
                                          <svg viewBox="0 0 24 24">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className="comment-body-text">{reply.content}</p>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={() => setReadingPost(null)}>
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Article' : 'Write an Article'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            
            <form className="modal-form" onSubmit={(e) => handleSubmit('published', e)}>
              <input
                name="title"
                placeholder="Post title..."
                value={formData.title}
                onChange={handleChange}
                required
              />

              <input
                name="category"
                list="category-suggestions"
                placeholder="Category (e.g. Healthcare, Information Technology)..."
                value={formData.category}
                onChange={handleChange}
                required
              />
              <datalist id="category-suggestions">
                {PRESET_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>

              {/* Native Label Dropzone File Browser */}
              <div className="media-uploader-box">
                <div className="media-uploader-header">
                  <span className="media-label">Article Cover Visual</span>
                  <button
                    type="button"
                    className="btn-magic-img"
                    onClick={handleGenerateMagicBanner}
                    title="Generate a high-res cover matched to your title and category"
                  >
                    ✨ Auto-Generate Cover
                  </button>
                </div>

                {formData.imageUrl ? (
                  <div className="media-preview-container">
                    <img
                      src={formData.imageUrl}
                      alt="Article Banner Preview"
                      className="media-preview-img"
                    />
                    <span className="media-preview-badge">Cover Ready</span>
                    <button
                      type="button"
                      className="btn-remove-media"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="article-cover-input"
                    className="dropzone-container"
                    style={{
                      display: 'block',
                      borderColor: isDragging ? 'var(--accent)' : '#cbd5e1',
                      background: isDragging ? '#eff6ff' : '#ffffff'
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      id="article-cover-input"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileInputChange}
                    />
                    <div className="dropzone-icon">☁️</div>
                    <div className="dropzone-title">
                      Drop an image here, or <span>Browse</span>
                    </div>
                    <div className="dropzone-subtitle">
                      Supports JPG, PNG, WEBP (Auto-optimized on Cloudinary)
                    </div>
                  </label>
                )}
              </div>

              <div className="editor-toolbar">
                <button type="button" className="toolbar-btn" onClick={() => insertFormatting('**', '**')}>
                  Bold
                </button>
                <button type="button" className="toolbar-btn" onClick={() => insertFormatting('*', '*')}>
                  Italic
                </button>
                <button type="button" className="toolbar-btn" onClick={() => insertFormatting('\n## ')}>
                  H2
                </button>
                <button type="button" className="toolbar-btn" onClick={() => insertFormatting('```\n', '\n```')}>
                  Code
                </button>
              </div>

              <textarea
                ref={textareaRef}
                name="content"
                className="rich-editor-area"
                placeholder="Write your article content here..."
                value={formData.content}
                onChange={handleChange}
                required
              />

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={(e) => handleSubmit('draft', e)}
                >
                  Save Draft
                </button>
                <button type="submit" className="btn-primary">
                  {editId ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Authentication Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>{isLoginView ? 'Sign In to DevPress' : 'Create an Account'}</h3>
            <p style={{ marginBottom: '1.25rem' }}>
              {isLoginView
                ? 'Enter your credentials to access your profile.'
                : 'Join DevPress to write and publish articles.'}
            </p>

            {authError && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}
              >
                ⚠ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="modal-form">
              {!isLoginView && (
                <input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={handleAuthInputChange}
                  required
                />
              )}
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={authForm.email}
                onChange={handleAuthInputChange}
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password (min 6 characters)"
                value={authForm.password}
                onChange={handleAuthInputChange}
                required
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginBottom: '1rem' }}
                disabled={authLoading}
              >
                {authLoading ? 'Authenticating...' : isLoginView ? 'Sign In' : 'Register'}
              </button>
            </form>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {isLoginView ? "Don't have an account? " : 'Already registered? '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                onClick={toggleAuthMode}
              >
                {isLoginView ? 'Register here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* 11. Hidden Administrative Gateway Modal */}
      {isAdminPortalOpen && (
        <div className="modal-overlay" onClick={() => setIsAdminPortalOpen(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>🛡️</div>
            <h3>System Admin Gateway</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Restricted internal console. Authenticate to grant administrative privileges to <strong>{currentUser?.name || 'current session'}</strong>.
            </p>
            <form onSubmit={handleAdminGatewayVerify} className="modal-form">
              <input
                type="password"
                placeholder="Master Secret Key"
                value={adminPortalKey}
                onChange={(e) => setAdminPortalKey(e.target.value)}
                required
                autoFocus
              />
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => setIsAdminPortalOpen(false)}
                >
                  Close
                </button>
                <button type="submit" className="btn-primary" style={{ background: '#dc2626' }}>
                  Authorize Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}