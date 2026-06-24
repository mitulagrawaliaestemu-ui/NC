import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  Globe, 
  Clock, 
  DollarSign, 
  Briefcase, 
  UserCheck, 
  AlertCircle, 
  CheckCircle, 
  ChevronUp, 
  BookOpen,
  Eye,
  Calendar,
  Lock,
  ListFilter,
  Check,
  TrendingUp,
  PieChart,
  BarChart,
  History,
  Info,
  Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Tab control for NC Admin ('offers', 'analytics', 'audit')
  const [ncTab, setNcTab] = useState('offers');

  // NC Admin States
  const [showAddForm, setShowAddForm] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    requirements: '',
    country: '',
    duration: '',
    payment: '',
    workType: 'Work',
    lcScope: 'GLOBAL',
    targetLc: '',
    deadline: ''
  });

  // Analytics Stats State
  const [ncStats, setNcStats] = useState(null);
  const [lcStats, setLcStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Member States
  const [memberApplications, setMemberApplications] = useState([]);
  const [submittingApp, setSubmittingApp] = useState(null);
  
  // Candidate Application Confirmation Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyOfferTarget, setApplyOfferTarget] = useState(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch offers
      const offersData = await authFetch('/api/offers');
      setOffers(offersData);

      // Role specific statistics and payloads
      if (user?.role === 'NC_ADMIN') {
        const statsData = await authFetch('/api/applications/stats');
        setNcStats(statsData);

        const logsData = await authFetch('/api/applications/audit-logs');
        setAuditLogs(logsData);
      } else if (user?.role === 'LC_ADMIN') {
        const statsData = await authFetch('/api/applications/lc-stats');
        setLcStats(statsData);
      } else if (user?.role === 'MEMBER') {
        const appsData = await authFetch('/api/applications/my');
        setMemberApplications(appsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStatus({ type: 'error', message: 'Failed to load portal data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle PDF Upload & OCR Parsing (NC Admin)
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsingPdf(true);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const data = await authFetch('/api/offers/parse-pdf', {
        method: 'POST',
        body: formData
      });

      let mappedWorkType = 'Work';
      if (data.workType === 'HYBRID') mappedWorkType = 'Hybrid';
      else if (data.workType === 'REMOTE') mappedWorkType = 'Research';

      // Format date for datetime-local (requires YYYY-MM-DDTHH:MM)
      let deadlineStr = '';
      if (data.deadline) {
        deadlineStr = data.deadline.includes('T') ? data.deadline.substring(0, 16) : `${data.deadline}T23:59`;
      }

      setNewOffer(prev => ({
        ...prev,
        title: data.title || '',
        description: data.description || '',
        requirements: data.requirements || '',
        country: data.country || '',
        duration: data.duration || '',
        payment: data.payment || '',
        workType: mappedWorkType,
        deadline: deadlineStr
      }));

      setStatus({ type: 'success', message: 'PDF parsed successfully! The form has been autofilled.' });
    } catch (error) {
      console.error('Error uploading/parsing PDF:', error);
      setStatus({ type: 'error', message: error.message || 'Failed to parse PDF offer.' });
    } finally {
      setParsingPdf(false);
      // Clear file input
      e.target.value = null;
    }
  };

  // Handle Offer Upload (NC Admin)
  const handleAddOfferSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (newOffer.lcScope === 'SPECIFIC' && !newOffer.targetLc) {
      setStatus({ type: 'error', message: 'Please select a target Local Committee (LC) for this offer' });
      return;
    }

    if (!newOffer.deadline) {
      setStatus({ type: 'error', message: 'Please set an application deadline' });
      return;
    }

    if (new Date(newOffer.deadline) <= new Date()) {
      setStatus({ type: 'error', message: 'Application deadline must be a future date' });
      return;
    }

    try {
      const data = await authFetch('/api/offers', {
        method: 'POST',
        body: JSON.stringify(newOffer)
      });

      setOffers([data, ...offers]);
      setShowAddForm(false);
      setNewOffer({
        title: '',
        description: '',
        requirements: '',
        country: '',
        duration: '',
        payment: '',
        workType: 'Work',
        lcScope: 'GLOBAL',
        targetLc: '',
        deadline: ''
      });
      setStatus({ type: 'success', message: 'Offer uploaded and logged successfully!' });
      fetchData(); // reload statistics
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to create offer' });
    }
  };

  // Handle Delete Offer (NC Admin)
  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer? This will delete all associated applications.')) {
      return;
    }

    try {
      await authFetch(`/api/offers/${id}`, { method: 'DELETE' });
      setOffers(offers.filter(offer => offer._id !== id));
      setStatus({ type: 'success', message: 'Offer deleted successfully' });
      fetchData(); // reload statistics
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to delete offer' });
    }
  };

  // Handle Release Offer (NC Admin or LC Admin)
  const handleReleaseOffer = async (id) => {
    try {
      const result = await authFetch(`/api/offers/${id}/release`, { method: 'PUT' });
      setOffers(offers.map(o => o._id === id ? result.offer : o));
      setStatus({ type: 'success', message: `Offer has been successfully released for candidates` });
      fetchData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to release offer' });
    }
  };

  // Handle Revoke/Unrelease Offer
  const handleUnreleaseOffer = async (id) => {
    try {
      const result = await authFetch(`/api/offers/${id}/unrelease`, { method: 'PUT' });
      setOffers(offers.map(o => o._id === id ? result.offer : o));
      setStatus({ type: 'success', message: `Offer has been successfully unreleased/revoked` });
      fetchData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to revoke offer' });
    }
  };

  // Prompt Candidate Apply Confirmation
  const promptApply = (offer) => {
    if (!user.resume || !user.resume.isCompleted) {
      setStatus({ 
        type: 'error', 
        message: 'Your resume profile is incomplete! Please complete your profile wizard before applying.' 
      });
      navigate('/resume');
      return;
    }
    setApplyOfferTarget(offer);
    setShowApplyModal(true);
  };

  // Handle Apply to Offer (Member)
  const handleApplyConfirm = async () => {
    if (!applyOfferTarget) return;
    
    const offerId = applyOfferTarget._id;
    setSubmittingApp(offerId);
    setStatus({ type: '', message: '' });
    setShowApplyModal(false);

    try {
      const result = await authFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ offerId })
      });

      setMemberApplications([result.application, ...memberApplications]);
      setStatus({ 
        type: 'success', 
        message: 'Application Submitted! Your resume snapshot has been collected and locked for this nomination.' 
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to submit application' });
    } finally {
      setSubmittingApp(null);
      setApplyOfferTarget(null);
    }
  };

  // Check if student applied to an offer
  const getApplicationStatus = (offerId) => {
    const app = memberApplications.find(a => a.offerId === offerId || a.offerId?._id === offerId);
    return app ? app.status : null;
  };

  // Custom Chart Renderers (CSS/SVG based, highly responsive & responsive)
  const renderBarChart = (data, color = 'var(--primary)') => {
    if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No chart data</p>;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    return (
      <div style={styles.chartContainer}>
        {data.map(d => {
          const pct = (d.count / maxVal) * 100;
          return (
            <div key={d.lc} style={styles.chartBarRow}>
              <span style={styles.chartBarLabel}>LC {d.lc}</span>
              <div style={styles.chartBarTrack}>
                <div style={{ ...styles.chartBarFill, width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span style={styles.chartBarValue}>{d.count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLineChart = (data) => {
    if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)' }}>No trends data available</p>;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const width = 500;
    const height = 150;
    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, idx) => {
      const x = padding + (idx / (data.length - 1 || 1)) * chartWidth;
      const y = height - padding - (d.count / maxVal) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ width: '100%', padding: '10px 0' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3" />
          
          <polyline fill="none" stroke="var(--primary)" strokeWidth="3" points={points} />
          
          {data.map((d, idx) => {
            const x = padding + (idx / (data.length - 1 || 1)) * chartWidth;
            const y = height - padding - (d.count / maxVal) * chartHeight;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="4" fill="#fff" stroke="var(--primary)" strokeWidth="2" />
                <text x={x} y={y - 8} fontSize="9" textAnchor="middle" fill="var(--text-primary)" fontWeight="bold">{d.count}</text>
                <text x={x} y={height - 5} fontSize="9" textAnchor="middle" fill="var(--text-muted)">{d.month}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderDistributionBar = (data) => {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    return (
      <div style={{ padding: '10px 0' }}>
        <div style={styles.segmentTrack}>
          {data.map((d, idx) => {
            const pct = (d.value / total) * 100;
            const colors = ['var(--primary)', 'var(--secondary)'];
            return (
              <div 
                key={idx} 
                style={{ 
                  width: `${pct}%`, 
                  backgroundColor: colors[idx % colors.length],
                  height: '14px',
                  transition: 'width 0.3s ease'
                }} 
                title={`${d.name}: ${d.value}`}
              />
            );
          })}
        </div>
        <div style={styles.segmentLegend}>
          {data.map((d, idx) => {
            const colors = ['var(--primary)', 'var(--secondary)'];
            return (
              <div key={idx} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: colors[idx % colors.length] }} />
                <span style={styles.legendText}>{d.name} ({d.value})</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading Portal Control Panel...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Status Alert Banner */}
      {status.message && (
        <div style={status.type === 'success' ? styles.successAlert : styles.errorAlert}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* RENDER FOR NC ADMIN */}
      {user.role === 'NC_ADMIN' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">National Committee Workspace</h1>
              <p style={{ color: 'var(--text-muted)' }}>Manage global offers, track performance metrics, and audit activities</p>
            </div>
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn btn-primary"
            >
              {showAddForm ? <ChevronUp size={18} /> : <Plus size={18} />}
              {showAddForm ? 'Cancel Creation' : 'Create New Offer'}
            </button>
          </div>

          {/* Stats Bar */}
          {ncStats && (
            <div style={styles.statsBar} className="grid-container grid-3">
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Total Offers</span>
                <span style={styles.statValue}>{ncStats.totalOffers}</span>
              </div>
              <span className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Active / Closed Offers</span>
                <span style={styles.statValue}>{ncStats.activeOffers} <span style={{ fontSize: '1.2rem', fontWeight: '500', color: 'var(--text-muted)' }}>/ {ncStats.closedOffers}</span></span>
              </span>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Total Applications</span>
                <span style={styles.statValue}>{ncStats.totalApplications}</span>
              </div>
            </div>
          )}

          {showAddForm && (
            <div className="glass-card animate-slide-up" style={styles.formCard}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>Create Internship Offer</h3>
              
              {/* PDF Autofill Section */}
              <div style={styles.uploadSection}>
                <div style={styles.uploadDropZone}>
                  <div style={styles.uploadIconContainer}>
                    <Upload size={20} style={{ color: 'var(--secondary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={styles.uploadTitle}>Autofill from PDF Offer Sheet</h4>
                    <p style={styles.uploadDesc}>Upload an IAESTE PDF offer sheet to automatically extract all fields using local OCR and AI.</p>
                  </div>
                  <div>
                    <label className="btn btn-secondary" style={{ cursor: parsingPdf ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      {parsingPdf ? (
                        <>
                          <div className="spinner-mini" style={{ marginRight: '6px' }}></div> Parsing Offer...
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Upload PDF Offer
                        </>
                      )}
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handlePdfUpload} 
                        style={{ display: 'none' }} 
                        disabled={parsingPdf}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddOfferSubmit}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Offer Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Embedded Systems Engineer"
                      value={newOffer.title}
                      onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Switzerland"
                      value={newOffer.country}
                      onChange={(e) => setNewOffer({ ...newOffer, country: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 3 Months"
                      value={newOffer.duration}
                      onChange={(e) => setNewOffer({ ...newOffer, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stipend / Payment</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 1500 CHF / month"
                      value={newOffer.payment}
                      onChange={(e) => setNewOffer({ ...newOffer, payment: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Mode</label>
                    <select 
                      className="form-select"
                      value={newOffer.workType}
                      onChange={(e) => setNewOffer({ ...newOffer, workType: e.target.value })}
                    >
                      <option value="Work">Office / Work</option>
                      <option value="Research">Research / Lab</option>
                      <option value="Hybrid">Hybrid Mode</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offer Scope</label>
                    <select 
                      className="form-select"
                      value={newOffer.lcScope}
                      onChange={(e) => setNewOffer({ ...newOffer, lcScope: e.target.value, targetLc: e.target.value === 'GLOBAL' ? '' : 'MU' })}
                    >
                      <option value="GLOBAL">Global (Visible to all LCs)</option>
                      <option value="SPECIFIC">LC Specific (Targeted to one LC)</option>
                    </select>
                  </div>

                  {newOffer.lcScope === 'SPECIFIC' && (
                    <div className="form-group">
                      <label className="form-label">Target Local Committee (LC)</label>
                      <select 
                        className="form-select"
                        value={newOffer.targetLc}
                        onChange={(e) => setNewOffer({ ...newOffer, targetLc: e.target.value })}
                        required
                      >
                        <option value="">Select Committee...</option>
                        <option value="MU">LC MU</option>
                        <option value="MUJ">LC MUJ</option>
                        <option value="KU">LC KU</option>
                        <option value="JECRC">LC JECRC</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={newOffer.deadline}
                      onChange={(e) => setNewOffer({ ...newOffer, deadline: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Specify project scope, tasks, and responsibilities..."
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Key Requirements / Skills</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="e.g. Python, Linux, Embedded C, LabView"
                    value={newOffer.requirements}
                    onChange={(e) => setNewOffer({ ...newOffer, requirements: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Save & Create Offer
                </button>
              </form>
            </div>
          )}

          {/* NC Tabs Header */}
          <div style={styles.tabsContainer}>
            <button 
              onClick={() => setNcTab('offers')} 
              style={ncTab === 'offers' ? styles.activeTabBtn : styles.tabBtn}
            >
              Distributed Offers
            </button>
            <button 
              onClick={() => setNcTab('analytics')} 
              style={ncTab === 'analytics' ? styles.activeTabBtn : styles.tabBtn}
            >
              <TrendingUp size={16} /> Analytics & Performance
            </button>
            <button 
              onClick={() => setNcTab('audit')} 
              style={ncTab === 'audit' ? styles.activeTabBtn : styles.tabBtn}
            >
              <History size={16} /> Audit Trail
            </button>
          </div>

          {/* Tab 1: Offers List */}
          {ncTab === 'offers' && (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>All Distributed Offers</h3>
              {offers.length === 0 ? (
                <div className="glass-card" style={styles.emptyCard}>
                  No offers created. Click "Create New Offer" to start.
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Title</th>
                        <th>Country</th>
                        <th>Scope</th>
                        <th>LC Target</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Final Winner</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map(offer => {
                        const isExpired = new Date(offer.deadline) < new Date();
                        const winner = offer.finalSelectedApplication?.resumeSnapshot?.personalInfo?.fullName || null;
                        
                        return (
                          <tr key={offer._id}>
                            <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{offer.offerCode}</td>
                            <td style={{ fontWeight: '500' }}>{offer.title}</td>
                            <td>{offer.country}</td>
                            <td>
                              <span className={offer.lcScope === 'GLOBAL' ? 'badge badge-global' : 'badge badge-specific'}>
                                {offer.lcScope}
                              </span>
                            </td>
                            <td>{offer.lcScope === 'GLOBAL' ? 'All Committees' : `LC ${offer.targetLc}`}</td>
                            <td>
                              <span style={isExpired ? { color: 'var(--danger)', fontWeight: '600' } : {}}>
                                {new Date(offer.deadline).toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              {offer.status === 'CLOSED' ? (
                                <span className="badge badge-danger">Closed</span>
                              ) : offer.status === 'RELEASED' ? (
                                <span className="badge badge-success">Released</span>
                              ) : (
                                <span className="badge badge-warning">Draft</span>
                              )}
                            </td>
                            <td>
                              {winner ? (
                                <span className="badge badge-success" style={{ fontWeight: '600' }}>{winner}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Selection</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {offer.status === 'DRAFT' && (
                                  <button 
                                    onClick={() => handleReleaseOffer(offer._id)}
                                    className="btn btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  >
                                    Release
                                  </button>
                                )}
                                {offer.status === 'RELEASED' && (
                                  <button 
                                    onClick={() => handleUnreleaseOffer(offer._id)}
                                    className="btn btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                                  >
                                    Revoke
                                  </button>
                                )}
                                <Link 
                                  to={`/applications?offerId=${offer._id}`} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  View Applicants
                                </Link>
                                <button 
                                  onClick={() => handleDeleteOffer(offer._id)} 
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                >
                                  Delete
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
            </div>
          )}

          {/* Tab 2: Analytics & Performance */}
          {ncTab === 'analytics' && ncStats && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Secondary Stats Grid */}
              <div className="grid-container grid-3">
                <div className="glass-card" style={styles.chartWrapperCard}>
                  <h4 style={styles.chartTitle}><PieChart size={16} /> Scope Distribution</h4>
                  {renderDistributionBar(ncStats.charts.offerTypeDistribution)}
                </div>
                <div className="glass-card" style={styles.chartWrapperCard}>
                  <h4 style={styles.chartTitle}><TrendingUp size={16} /> Monthly Trends</h4>
                  {renderLineChart(ncStats.charts.monthlyTrends)}
                </div>
                <div className="glass-card" style={styles.chartWrapperCard}>
                  <h4 style={styles.chartTitle}><BarChart size={16} /> Applications by LC</h4>
                  {renderBarChart(ncStats.charts.applicationsByLc, 'var(--secondary)')}
                </div>
              </div>

              {/* LC Performance Table */}
              <div className="glass-card" style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>Local Committee (LC) Performance Tracking</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Local Committee</th>
                        <th>Offers Received</th>
                        <th>Total Applications</th>
                        <th>Total Nominations</th>
                        <th>Success Rate</th>
                        <th>Last Activity Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ncStats.lcPerformance.map(perf => (
                        <tr key={perf.lcCode}>
                          <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{perf.lcName}</td>
                          <td>{perf.offersReceived}</td>
                          <td>{perf.applicationsCount}</td>
                          <td>{perf.nominationsCount}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={styles.smallTrack}>
                                <div style={{ ...styles.smallBar, width: `${perf.successRate}%`, backgroundColor: perf.successRate > 50 ? 'var(--success)' : 'var(--primary)' }} />
                              </div>
                              <span style={{ fontWeight: '600' }}>{perf.successRate}%</span>
                            </div>
                          </td>
                          <td>
                            {perf.lastActivity ? (
                              new Date(perf.lastActivity).toLocaleDateString()
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>No recent activity</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Audit Trail */}
          {ncTab === 'audit' && (
            <div className="animate-fade-in">
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '600' }}>System Audit Logs</h3>
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Performed By</th>
                      <th>Committee</th>
                      <th>Description</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log._id}>
                        <td>
                          <span className={
                            log.action === 'OFFER_CREATION' ? 'badge badge-specific' :
                            log.action === 'OFFER_RELEASE' ? 'badge badge-success' :
                            log.action === 'CANDIDATE_APPLICATION' ? 'badge badge-global' :
                            log.action === 'NOMINATION_SELECTION' ? 'badge badge-warning' :
                            'badge badge-danger'
                          }>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600' }}>{log.performedBy?.name || 'System'}</td>
                        <td><span className="badge badge-specific">{log.performedBy?.lc || 'N/A'}</span></td>
                        <td>{log.details}</td>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No system logs generated yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* RENDER FOR LC ADMIN */}
      {user.role === 'LC_ADMIN' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Committee Control Panel (LC {user.lc})</h1>
              <p style={{ color: 'var(--text-muted)' }}>Release distributed internships, review profiles, and manage local candidate nominations</p>
            </div>
          </div>

          {/* LC Statistics Bar */}
          {lcStats && (
            <div style={styles.statsBar} className="grid-container grid-4">
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Active Offers</span>
                <span style={styles.statValue}>{lcStats.activeOffers}</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Applications Received</span>
                <span style={styles.statValue}>{lcStats.applicationsReceived}</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Candidates Nominated</span>
                <span style={styles.statValue}>{lcStats.candidatesNominated}</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <span style={styles.statLabel}>Closed Offers</span>
                <span style={styles.statValue}>{lcStats.closedOffers}</span>
              </div>
            </div>
          )}

          {/* LC Offers management block */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: '600', margin: 0 }}>Offers Available for LC {user.lc}</h3>
              <Link to="/applications" className="btn btn-secondary">
                <Eye size={16} /> Review Candidate Resumes
              </Link>
            </div>
            
            {offers.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                No offers distributed to LC {user.lc} yet. Please wait for the National Committee to assign opportunities.
              </div>
            ) : (
              <div className="grid-container grid-2">
                {offers.map(offer => {
                  const isReleased = offer.releasedLcs.includes(user.lc);
                  const isExpired = new Date(offer.deadline) < new Date();
                  const winner = offer.finalSelectedApplication?.resumeSnapshot?.personalInfo?.fullName || null;
                  
                  return (
                    <div key={offer._id} className="glass-card" style={styles.offerCard}>
                      <div style={styles.cardHeader}>
                        <div>
                          <span style={styles.cardCode}>{offer.offerCode}</span>
                          <h4 style={styles.cardTitle}>{offer.title}</h4>
                        </div>
                        <span className={offer.lcScope === 'GLOBAL' ? 'badge badge-global' : 'badge badge-specific'}>
                          {offer.lcScope}
                        </span>
                      </div>

                      <div style={styles.infoRowGrid}>
                        <div style={styles.infoRowItem}>
                          <Globe size={14} />
                          <span>{offer.country}</span>
                        </div>
                        <div style={styles.infoRowItem}>
                          <Clock size={14} />
                          <span>{offer.duration}</span>
                        </div>
                        {offer.payment && (
                          <div style={styles.infoRowItem}>
                            <DollarSign size={14} />
                            <span>{offer.payment}</span>
                          </div>
                        )}
                        <div style={styles.infoRowItem}>
                          <Briefcase size={14} />
                          <span>{offer.workType}</span>
                        </div>
                      </div>

                      <p style={styles.cardDesc}>{offer.description.substring(0, 140)}...</p>

                      <div style={styles.deadlineBadgeBlock}>
                        <Calendar size={14} /> Deadline: 
                        <strong style={{ marginLeft: '4px' }}>{new Date(offer.deadline).toLocaleDateString()}</strong>
                        {isExpired && <span className="badge badge-danger" style={{ marginLeft: '10px', fontSize: '0.65rem' }}>Expired</span>}
                      </div>

                      {winner && (
                        <div style={styles.winnerAnnounce}>
                          <Award size={16} color="var(--success)" />
                          <span>Winner Selected: <strong>{winner}</strong></span>
                        </div>
                      )}

                      <div style={styles.cardActionRow}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {isReleased ? (
                            <span className="badge badge-success">Released</span>
                          ) : (
                            <span className="badge badge-warning">Draft</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isReleased ? (
                            <button 
                              onClick={() => handleUnreleaseOffer(offer._id)}
                              className="btn btn-danger"
                              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReleaseOffer(offer._id)}
                              className="btn btn-primary"
                              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                              disabled={isExpired}
                            >
                              Release Offer
                            </button>
                          )}
                          <Link 
                            to={`/applications?offerId=${offer._id}`} 
                            className="btn btn-secondary" 
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          >
                            Applicants
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* RENDER FOR STUDENT MEMBER */}
      {user.role === 'MEMBER' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Explore Global Placements</h1>
              <p style={{ color: 'var(--text-muted)' }}>Welcome, {user.name}! Browse and nominate yourself for active internships released in LC {user.lc}</p>
            </div>
            
            <Link to="/resume" className="btn btn-secondary">
              <BookOpen size={16} />
              Build Resume Profile
            </Link>
          </div>

          {/* Resume completeness banner */}
          {(!user.resume || !user.resume.isCompleted) && (
            <div className="glass-card animate-slide-up" style={styles.resumeBanner}>
              <AlertCircle size={24} color="var(--warning)" />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontWeight: '600' }}>Complete your profile wizard!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  You must complete all steps of the profile wizard before you are permitted to apply for any global placements.
                </p>
              </div>
              <Link to="/resume" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Start Wizard
              </Link>
            </div>
          )}

          {/* Student Job Board */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>Active Internships in LC {user.lc}</h3>
            
            {offers.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                There are no active placements released in LC {user.lc} at the moment. Please check back later.
              </div>
            ) : (
              <div className="grid-container grid-2">
                {offers.map(offer => {
                  const appStatus = getApplicationStatus(offer._id);
                  const isExpired = new Date(offer.deadline) < new Date();
                  
                  return (
                    <div key={offer._id} className="glass-card animate-slide-up" style={styles.offerCard}>
                      <div style={styles.cardHeader}>
                        <div>
                          <span style={styles.cardCode}>{offer.offerCode}</span>
                          <h4 style={styles.cardTitle}>{offer.title}</h4>
                        </div>
                        <span className="badge badge-global">
                          {offer.country}
                        </span>
                      </div>

                      <div style={styles.infoRowGrid}>
                        <div style={styles.infoRowItem}>
                          <Clock size={14} />
                          <span>{offer.duration}</span>
                        </div>
                        {offer.payment && (
                          <div style={styles.infoRowItem}>
                            <DollarSign size={14} />
                            <span>{offer.payment}</span>
                          </div>
                        )}
                        <div style={styles.infoRowItem}>
                          <Briefcase size={14} />
                          <span>{offer.workType}</span>
                        </div>
                      </div>

                      <div style={{ margin: '14px 0' }}>
                        <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px', fontWeight: '600' }}>Job Description:</h5>
                        <p style={styles.cardDesc}>{offer.description}</p>
                      </div>

                      {offer.requirements && (
                        <div style={{ margin: '14px 0' }}>
                          <h5 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px', fontWeight: '600' }}>Core Skills Required:</h5>
                          <p style={styles.cardDesc}>{offer.requirements}</p>
                        </div>
                      )}

                      <div style={styles.deadlineBadgeBlock}>
                        <Calendar size={14} /> Deadline to Apply: 
                        <strong style={{ marginLeft: '4px' }}>{new Date(offer.deadline).toLocaleString()}</strong>
                        {isExpired && <span className="badge badge-danger" style={{ marginLeft: '10px', fontSize: '0.65rem' }}>Deadline Passed</span>}
                      </div>

                      <div style={styles.cardActionRowStudent}>
                        {appStatus ? (
                          <div style={{ ...styles.appliedStatusWrapper, 
                            backgroundColor: appStatus === 'SELECTED' ? 'rgba(16, 185, 129, 0.08)' : appStatus === 'NOMINATED' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0, 59, 89, 0.08)',
                            borderColor: appStatus === 'SELECTED' ? 'rgba(16, 185, 129, 0.2)' : appStatus === 'NOMINATED' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 59, 89, 0.2)',
                            color: appStatus === 'SELECTED' ? 'var(--success)' : appStatus === 'NOMINATED' ? 'var(--warning)' : 'var(--primary)'
                          }}>
                            {appStatus === 'SELECTED' ? (
                              <>
                                <Award size={18} color="var(--success)" />
                                <span style={{ fontWeight: '700' }}>Selected Winner! Nomination Closed</span>
                              </>
                            ) : appStatus === 'NOMINATED' ? (
                              <>
                                <CheckCircle size={18} color="var(--warning)" />
                                <span style={{ fontWeight: '700' }}>Nominated by LC! Final Decision Pending</span>
                              </>
                            ) : appStatus === 'NOT_SELECTED' ? (
                              <>
                                <Lock size={18} color="var(--danger)" />
                                <span style={{ fontWeight: '700', color: 'var(--danger)' }}>Not Selected</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={18} color="var(--primary)" />
                                <span style={{ fontWeight: '700' }}>Nomination Locked (Applied)</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => promptApply(offer)}
                            className="btn btn-primary"
                            disabled={submittingApp === offer._id || isExpired || !user.resume?.isCompleted}
                            style={{ padding: '12px 18px', width: '100%', justifyContent: 'center' }}
                          >
                            {isExpired 
                              ? 'Application Deadline Passed' 
                              : submittingApp === offer._id 
                                ? 'Submitting Application...' 
                                : 'Quick Apply with Profile'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Apply Confirmation Modal */}
      {showApplyModal && applyOfferTarget && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modalContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <AlertCircle size={24} color="var(--primary)" />
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Confirm Nomination Submission</h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              You are about to apply for the placement: <strong style={{ color: 'var(--primary)' }}>{applyOfferTarget.title} ({applyOfferTarget.offerCode})</strong>. 
            </p>
            
            <div style={styles.warningCard}>
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Important:</strong> Applying collects a static snapshot of your current resume. Once submitted, <strong>you cannot withdraw your application, edit your resume snapshot, or modify your nomination.</strong>
              </p>
            </div>

            <div style={styles.modalActions}>
              <button 
                onClick={() => setShowApplyModal(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyConfirm} 
                className="btn btn-primary"
                style={{ boxShadow: 'none' }}
              >
                Confirm & Lock Nomination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 24px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    padding: '16px',
    marginBottom: '24px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '16px',
    marginBottom: '24px',
  },
  statsBar: {
    marginBottom: '30px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  statValue: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  uploadSection: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'rgba(0, 119, 145, 0.03)',
    border: '1px dashed rgba(0, 119, 145, 0.25)',
    borderRadius: 'var(--radius-md)',
  },
  uploadDropZone: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'left',
  },
  uploadIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(0, 119, 145, 0.08)',
    borderRadius: 'var(--radius-md)',
    flexShrink: 0,
  },
  uploadTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 4px 0',
  },
  uploadDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: '1.4',
  },
  formCard: {
    padding: '30px',
    marginBottom: '30px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  emptyCard: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
  },
  offerCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '14px',
  },
  cardCode: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--primary)',
    letterSpacing: '0.05em',
  },
  cardTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    marginTop: '2px',
    fontWeight: '600',
  },
  infoRowGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '14px',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '14px',
  },
  infoRowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.55',
    margin: 0,
  },
  deadlineBadgeBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '6px',
    width: 'fit-content',
  },
  winnerAnnounce: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    color: 'var(--success)',
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '6px',
  },
  cardActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
    gap: '10px',
  },
  cardActionRowStudent: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  appliedStatusWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '1px solid transparent',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.95rem',
  },
  resumeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    borderLeft: '4px solid var(--warning)',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '24px',
    gap: '16px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'var(--transition-fast)',
  },
  activeTabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid var(--primary)',
    color: 'var(--text-primary)',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'var(--transition-fast)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  // Charts layout styles
  chartWrapperCard: {
    padding: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  chartTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '10px 0',
  },
  chartBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  chartBarLabel: {
    width: '60px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  chartBarTrack: {
    flex: 1,
    height: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: '99px',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  chartBarValue: {
    width: '24px',
    textAlign: 'right',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  // Distribution Segment Styles
  segmentTrack: {
    display: 'flex',
    borderRadius: '99px',
    overflow: 'hidden',
    height: '14px',
    backgroundColor: 'var(--bg-tertiary)',
    marginBottom: '16px',
  },
  segmentLegend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  smallTrack: {
    width: '80px',
    height: '6px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  smallBar: {
    height: '100%',
    borderRadius: '99px',
  },
  // Apply Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: 'var(--shadow-lg)',
    transition: 'none',
  },
  warningCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: 'rgba(0, 59, 89, 0.04)',
    border: '1px solid rgba(0, 59, 89, 0.1)',
    padding: '12px 16px',
    borderRadius: '6px',
    margin: '16px 0 24px 0',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  }
};

export default Dashboard;
