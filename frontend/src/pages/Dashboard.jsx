import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, REDIRECT_URL } from '../context/AuthContext';
import { 
  Link2, Copy, Check, BarChart2, Trash2, Edit2, 
  Plus, Calendar, ShieldAlert, Globe, ExternalLink, 
  QrCode, X, Search, LogOut 
} from 'lucide-react';

const Dashboard = () => {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  
  // URL List state
  const [urls, setUrls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Shortener Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Modal state
  const [activeQrUrl, setActiveQrUrl] = useState(null);
  
  // Edit Modal state
  const [editingUrl, setEditingUrl] = useState(null);
  const [editDestinationUrl, setEditDestinationUrl] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Clipboard copied indicator
  const [copiedId, setCopiedId] = useState(null);

  // Load URLs
  const fetchUrls = async () => {
    try {
      const res = await authFetch('/urls');
      if (res.ok) {
        const data = await res.json();
        setUrls(data);
      }
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(null);
    setIsSubmitting(true);

    if (!originalUrl) {
      setFormError('Original URL is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await authFetch('/urls/shorten', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
          expiresAt: expiresAt || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to shorten URL');
      }

      setFormSuccess(data);
      setOriginalUrl('');
      setCustomAlias('');
      setExpiresAt('');
      fetchUrls(); // Refresh table
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortened URL? This will also delete all associated analytics.')) {
      return;
    }

    try {
      const res = await authFetch(`/urls/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUrls(urls.filter(u => u._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete URL');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleOpenEdit = (url) => {
    setEditingUrl(url);
    setEditDestinationUrl(url.originalUrl);
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsEditing(true);

    try {
      const res = await authFetch(`/urls/${editingUrl._id}`, {
        method: 'PUT',
        body: JSON.stringify({ originalUrl: editDestinationUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update URL');
      }

      setUrls(urls.map(u => u._id === editingUrl._id ? data : u));
      setEditingUrl(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleCopyToClipboard = (shortCode, id) => {
    const shortUrl = `${REDIRECT_URL}/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUrls = urls.filter(u => 
    u.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="main-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/dashboard" className="logo-wrapper title-font" style={{ fontWeight: 800 }}>
            <Link2 size={28} className="text-gradient" style={{ stroke: 'url(#grad-primary)' }} />
            <span>Zap<span className="text-gradient">Link</span></span>
          </Link>
          <div className="nav-user">
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{user?.email}</span>
            <button onClick={logout} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="content-container animate-fade-in">
        {/* URL Shortener Form */}
        <section className="glass-panel" style={{ marginBottom: '40px' }}>
          <h2 className="title-font" style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={22} color="var(--primary)" />
            <span>Shorten a new URL</span>
          </h2>

          <form onSubmit={handleShorten} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination URL</label>
              <div style={{ position: 'relative' }}>
                <Globe size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://example.com/very/long/path/to/resource"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Custom Alias (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>/r/</span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="my-custom-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Link Expiration (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    style={{ paddingLeft: '44px' }}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.875rem' }}>
                <ShieldAlert size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '8px', color: '#a7f3d0' }}>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={18} color="var(--success)" /> URL Shortened Successfully!
                </p>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                  <span style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>{REDIRECT_URL}/{formSuccess.shortCode}</span>
                  <button 
                    type="button" 
                    onClick={() => handleCopyToClipboard(formSuccess.shortCode, 'success')} 
                    className="btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '0.8rem', marginLeft: 'auto' }}
                  >
                    {copiedId === 'success' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    <span>{copiedId === 'success' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ justifySelf: 'start', padding: '12px 28px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Shortening...' : 'Generate Short URL'}
            </button>
          </form>
        </section>

        {/* Short URLs List */}
        <section className="glass-panel">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="title-font" style={{ fontSize: '1.5rem' }}>Your Links</h2>
            
            {/* Search filter */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', paddingVertical: '8px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Loading links...</div>
          ) : filteredUrls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No matching links found.' : 'You haven\'t created any links yet. Enter a long URL above!'}
            </div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Link Metadata</th>
                    <th>Shortened URL</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'center' }}>Clicks</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUrls.map((url) => {
                    const shortUrl = `${REDIRECT_URL}/${url.shortCode}`;
                    return (
                      <tr key={url._id} className="animate-fade-in">
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {url.title || 'Untitled Link'}
                          </div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {url.originalUrl}
                          </div>
                          {url.expiresAt && (
                            <span className="badge badge-info" style={{ marginTop: '6px', fontSize: '0.7rem' }}>
                              Expires: {new Date(url.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>{shortUrl}</span>
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)' }} title="Open original link">
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {new Date(url.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          <span className="badge badge-success">{url.clicksCount}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleCopyToClipboard(url.shortCode, url._id)} 
                              className="btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                              title="Copy short URL"
                            >
                              {copiedId === url._id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                              <span>{copiedId === url._id ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button 
                              onClick={() => setActiveQrUrl(shortUrl)} 
                              className="btn-secondary" 
                              style={{ padding: '6px 8px' }}
                              title="Show QR Code"
                            >
                              <QrCode size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(url)} 
                              className="btn-secondary" 
                              style={{ padding: '6px 8px' }}
                              title="Edit link"
                            >
                              <Edit2 size={14} />
                            </button>
                            <Link 
                              to={`/analytics/${url._id}`} 
                              className="btn-secondary" 
                              style={{ padding: '6px 8px', textDecoration: 'none' }}
                              title="View analytics"
                            >
                              <BarChart2 size={14} color="var(--primary)" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(url._id)} 
                              className="btn-secondary btn-danger" 
                              style={{ padding: '6px 8px' }}
                              title="Delete Link"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* QR Code Modal */}
      {activeQrUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '360px', padding: '30px', textAlign: 'center', background: '#0e1424' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="title-font" style={{ fontSize: '1.25rem' }}>QR Code</h3>
              <button onClick={() => setActiveQrUrl(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', marginBottom: '20px' }}>
              {/* Generate QR using standard server API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQrUrl)}`} 
                alt="QR Code" 
                style={{ display: 'block', width: '200px', height: '200px' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', wordBreak: 'break-all', marginBottom: '20px' }}>{activeQrUrl}</p>
            <button onClick={() => setActiveQrUrl(null)} className="btn-primary" style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}

      {/* Edit URL Modal */}
      {editingUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '95%', maxWidth: '480px', padding: '30px', background: '#0e1424' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="title-font" style={{ fontSize: '1.25rem' }}>Edit Destination Link</h3>
              <button onClick={() => setEditingUrl(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  Updating this destination will redirect users visiting the short URL <span style={{ color: 'var(--primary)', fontWeight: 600 }}>/r/{editingUrl.shortCode}</span> to the new link.
                </p>
                <label className="form-label">Destination URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={editDestinationUrl}
                  onChange={(e) => setEditDestinationUrl(e.target.value)}
                  required
                />
              </div>

              {editError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.875rem' }}>
                  <ShieldAlert size={18} />
                  <span>{editError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingUrl(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={isEditing}>
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
