import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, BarChart2, Calendar, Clock, Globe, 
  Monitor, Laptop, ShieldAlert, Check, Copy
} from 'lucide-react';

const Analytics = () => {
  const { urlId } = useParams();
  const { authFetch } = useAuth();
  
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await authFetch(`http://localhost:5000/api/analytics/${urlId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch analytics data');
        }
        
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [urlId]);

  const handleCopy = (shortCode) => {
    const shortUrl = `http://localhost:5000/r/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>Loading analytics...</div>;
  }

  if (error || !analyticsData) {
    return (
      <div className="content-container" style={{ maxWidth: '600px', paddingTop: '80px' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <ShieldAlert size={48} color="var(--danger)" style={{ margin: '0 auto 16px auto' }} />
          <h2 className="title-font" style={{ marginBottom: '12px' }}>Error Loading Analytics</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{error || 'An unexpected error occurred.'}</p>
          <Link to="/dashboard" className="btn-primary">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const { urlInfo, summary, deviceStats, browserStats, osStats, dailyTrends, recentVisits } = analyticsData;

  // Custom SVG Area Chart Helper Calculations for Daily Trends
  const renderSvgChart = () => {
    if (dailyTrends.length === 0) {
      return (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          No trend data available. Shorten the link and click it to see daily activity charts.
        </div>
      );
    }

    // Chart dimensions
    const width = 800;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min/max values
    const maxClicks = Math.max(...dailyTrends.map(t => t.clicks), 5); // Fallback to 5 to avoid flat chart at zero

    // Generate points
    const points = dailyTrends.map((t, index) => {
      const x = paddingLeft + (index / (dailyTrends.length - 1 || 1)) * chartWidth;
      const y = paddingTop + chartHeight - (t.clicks / maxClicks) * chartHeight;
      return { x, y, label: t.date, val: t.clicks };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Path for the shaded gradient area under the curve
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <div style={{ width: '100%', overflowX: 'auto', marginTop: '16px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
          <defs>
            {/* Stroke Gradient */}
            <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            {/* Fill Gradient */}
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxClicks * (1 - ratio));
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--color-text-muted)" fontSize="10" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {/* Render Area under the curve */}
          {areaD && <path d={areaD} fill="url(#fillGrad)" />}

          {/* Render Line curve */}
          {pathD && <path d={pathD} fill="none" stroke="url(#chartGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Render data nodes */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-node">
              <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="var(--primary)" strokeWidth="2.5" />
              <title>{`${p.label}: ${p.val} clicks`}</title>
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((p, idx) => {
            // Only show labels occasionally if too many to avoid overlap
            if (points.length > 7 && idx % 2 !== 0) return null;
            return (
              <text key={idx} x={p.x} y={height - 8} fill="var(--color-text-muted)" fontSize="10" textAnchor="middle">
                {new Date(p.label).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Progress Bar Renderer for breakdown distributions
  const renderDistributionList = (title, icon, stats) => {
    const totalCount = stats.reduce((acc, item) => acc + item.value, 0);
    return (
      <div className="glass-panel" style={{ flex: '1 1 300px' }}>
        <h3 className="title-font" style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <span>{title}</span>
        </h3>
        
        {stats.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No stats available yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats.map((item, idx) => {
              const percentage = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{item.value} ({percentage}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: 'var(--grad-primary)', 
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="main-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/dashboard" className="logo-wrapper title-font" style={{ fontWeight: 800 }}>
            <BarChart2 size={24} className="text-gradient" />
            <span>Zap<span className="text-gradient">Link</span> Analytics</span>
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="content-container animate-fade-in">
        {/* Link Header */}
        <section className="glass-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="title-font" style={{ fontSize: '1.75rem', marginBottom: '6px', color: '#fff' }}>{urlInfo.title || 'Link Analytics'}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', wordBreak: 'break-all', maxWidth: '600px' }}>
                Dest: <a href={urlInfo.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  {urlInfo.originalUrl}
                </a>
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f3f4f6' }}>http://localhost:5000/r/{urlInfo.shortCode}</span>
              <button 
                onClick={() => handleCopy(urlInfo.shortCode)} 
                className="btn-secondary" 
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              >
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Quick Stats Summary Grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={28} color="var(--success)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Total Clicks</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{summary.totalClicks}</p>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={28} color="var(--primary)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Last Clicked</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                {summary.lastVisited ? new Date(summary.lastVisited).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={28} color="var(--accent)" />
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Creation Date</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                {new Date(urlInfo.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Daily Trend Line Chart */}
        <section className="glass-panel" style={{ marginBottom: '24px' }}>
          <h2 className="title-font" style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} color="var(--primary)" />
            <span>Click Trend (Last 14 Days)</span>
          </h2>
          {renderSvgChart()}
        </section>

        {/* Breakdown distributions (Devices, Browsers, OSs) */}
        <section style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
          {renderDistributionList('Devices', <Laptop size={18} color="var(--accent)" />, deviceStats)}
          {renderDistributionList('Browsers', <Globe size={18} color="var(--primary)" />, browserStats)}
          {renderDistributionList('Operating Systems', <Monitor size={18} color="var(--secondary)" />, osStats)}
        </section>

        {/* Recent Visits Log Table */}
        <section className="glass-panel">
          <h2 className="title-font" style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color="var(--primary)" />
            <span>Recent Visits (Last 20 clicks)</span>
          </h2>

          {recentVisits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)' }}>No clicks recorded yet. Click the shortened link to test tracking!</div>
          ) : (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th>Device</th>
                    <th>OS</th>
                    <th>Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVisits.map((visit, index) => (
                    <tr key={visit._id || index}>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(visit.timestamp).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{visit.ip}</td>
                      <td>{visit.device}</td>
                      <td>{visit.os}</td>
                      <td>{visit.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Analytics;
