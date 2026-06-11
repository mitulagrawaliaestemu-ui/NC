/* eslint-disable react-hooks/set-state-in-effect */
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
  Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // NC Admin States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    requirements: '',
    country: '',
    duration: '',
    payment: '',
    workType: 'Work',
    lcScope: 'GLOBAL',
    targetLc: ''
  });

  // Member States
  const [memberApplications, setMemberApplications] = useState([]);
  const [submittingApp, setSubmittingApp] = useState(null);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch offers
      const offersData = await authFetch('/api/offers');
      setOffers(offersData);

      // If user is Member, fetch their applications to check apply status
      if (user?.role === 'MEMBER') {
        const appsData = await authFetch('/api/applications/my');
        setMemberApplications(appsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatus({ type: 'error', message: 'Failed to load offers. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Handle Offer Upload (NC Admin)
  const handleAddOfferSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (newOffer.lcScope === 'SPECIFIC' && !newOffer.targetLc) {
      setStatus({ type: 'error', message: 'Please select a target Local Committee (LC) for this offer' });
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
        targetLc: ''
      });
      setStatus({ type: 'success', message: 'Offer uploaded successfully!' });
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
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to delete offer' });
    }
  };

  // Handle Release Offer (LC Admin)
  const handleReleaseOffer = async (id) => {
    try {
      const result = await authFetch(`/api/offers/${id}/release`, { method: 'PUT' });
      setOffers(offers.map(o => o._id === id ? result.offer : o));
      setStatus({ type: 'success', message: `Offer has been successfully released in LC ${user.lc}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to release offer' });
    }
  };

  // Handle Unrelease Offer (LC Admin)
  const handleUnreleaseOffer = async (id) => {
    try {
      const result = await authFetch(`/api/offers/${id}/unrelease`, { method: 'PUT' });
      setOffers(offers.map(o => o._id === id ? result.offer : o));
      setStatus({ type: 'success', message: `Offer has been removed/unreleased from LC ${user.lc}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to unrelease offer' });
    }
  };

  // Handle Apply to Offer (Member)
  const handleApply = async (offerId) => {
    if (!user.resume || !user.resume.isCompleted) {
      setStatus({ 
        type: 'error', 
        message: 'Your resume profile is incomplete! Please complete your resume details before applying.' 
      });
      navigate('/resume');
      return;
    }

    setSubmittingApp(offerId);
    setStatus({ type: '', message: '' });

    try {
      const result = await authFetch('/api/applications', {
        method: 'POST',
        body: JSON.stringify({ offerId })
      });

      setMemberApplications([result.application, ...memberApplications]);
      setStatus({ type: 'success', message: 'Application submitted successfully! Resume copy collected.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to submit application' });
    } finally {
      setSubmittingApp(null);
    }
  };

  // Check if student applied to an offer
  const getApplicationStatus = (offerId) => {
    const app = memberApplications.find(a => a.offerId === offerId || a.offerId?._id === offerId);
    return app ? app.status : null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Loading Portal Data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Alert Header */}
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
              <h1 className="page-title">National Committee Dashboard</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage all internship offers and distribute to local committees</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn btn-primary"
            >
              {showAddForm ? <ChevronUp size={18} /> : <Plus size={18} />}
              {showAddForm ? 'Cancel Upload' : 'Upload New Offer'}
            </button>
          </div>

          {/* Stats Bar */}
          <div style={styles.statsBar} className="grid-container grid-3">
            <div className="glass-card" style={styles.statCard}>
              <span style={styles.statLabel}>Total Offers</span>
              <span style={styles.statValue}>{offers.length}</span>
            </div>
            <div className="glass-card" style={styles.statCard}>
              <span style={styles.statLabel}>Global Offers</span>
              <span style={styles.statValue}>{offers.filter(o => o.lcScope === 'GLOBAL').length}</span>
            </div>
            <div className="glass-card" style={styles.statCard}>
              <span style={styles.statLabel}>Targeted Offers</span>
              <span style={styles.statValue}>{offers.filter(o => o.lcScope === 'SPECIFIC').length}</span>
            </div>
          </div>

          {/* Add Offer Form (Expandable) */}
          {showAddForm && (
            <div className="glass-card animate-slide-up" style={styles.formCard}>
              <h2 style={{ marginBottom: '20px', color: '#fff' }}>Upload Internship Offer</h2>
              <form onSubmit={handleAddOfferSubmit}>
                <div style={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Offer Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Frontend developer Intern"
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
                      placeholder="e.g. Germany"
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
                      placeholder="e.g. 8 Weeks"
                      value={newOffer.duration}
                      onChange={(e) => setNewOffer({ ...newOffer, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Compensation / Payment</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 950 EUR / month"
                      value={newOffer.payment}
                      onChange={(e) => setNewOffer({ ...newOffer, payment: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Type</label>
                    <select 
                      className="form-select"
                      value={newOffer.workType}
                      onChange={(e) => setNewOffer({ ...newOffer, workType: e.target.value })}
                    >
                      <option value="Work">Office / Work</option>
                      <option value="Research">Research / Labs</option>
                      <option value="Study">Study / Academy</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offer Distribution Scope</label>
                    <select 
                      className="form-select"
                      value={newOffer.lcScope}
                      onChange={(e) => setNewOffer({ ...newOffer, lcScope: e.target.value, targetLc: e.target.value === 'GLOBAL' ? '' : 'MU' })}
                    >
                      <option value="GLOBAL">Global (Distribute to all LCs)</option>
                      <option value="SPECIFIC">Specific LC (Upload to a selected LC)</option>
                    </select>
                  </div>

                  {newOffer.lcScope === 'SPECIFIC' && (
                    <div className="form-group">
                      <label className="form-label">Select Target Local Committee</label>
                      <select 
                        className="form-select"
                        value={newOffer.targetLc}
                        onChange={(e) => setNewOffer({ ...newOffer, targetLc: e.target.value })}
                        required
                      >
                        <option value="">Select LC...</option>
                        <option value="MU">LC MU</option>
                        <option value="MUJ">LC MUJ</option>
                        <option value="KU">LC KU</option>
                        <option value="JECRC">LC JECRC</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    placeholder="Provide responsibilities, tools, and background details..."
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    required
                  ></textarea>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Requirements & Skills</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2" 
                    placeholder="e.g. Knowledge of Node.js, MERN Stack, Good communication skills..."
                    value={newOffer.requirements}
                    onChange={(e) => setNewOffer({ ...newOffer, requirements: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Plus size={18} /> Upload Offer
                </button>
              </form>
            </div>
          )}

          {/* NC Offers List */}
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ marginBottom: '20px', color: '#fff' }}>All Distributed Offers</h2>
            {offers.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                No offers uploaded yet. Click "Upload New Offer" to start.
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
                      <th>Target LC</th>
                      <th>Released By LCs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map(offer => (
                      <tr key={offer._id}>
                        <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{offer.offerCode}</td>
                        <td>{offer.title}</td>
                        <td>{offer.country}</td>
                        <td>
                          <span className={offer.lcScope === 'GLOBAL' ? 'badge badge-global' : 'badge badge-specific'}>
                            {offer.lcScope}
                          </span>
                        </td>
                        <td>{offer.lcScope === 'GLOBAL' ? 'ALL LCs' : `LC ${offer.targetLc}`}</td>
                        <td>
                          {offer.releasedLcs.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>Not released yet</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {offer.releasedLcs.map(lc => (
                                <span key={lc} className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{lc}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteOffer(offer._id)} 
                            style={styles.actionDeleteBtn}
                            title="Delete Offer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* RENDER FOR LC ADMIN */}
      {user.role === 'LC_ADMIN' && (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Local Committee Control Panel ({user.lc})</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Review and release offers to students belonging to LC {user.lc}</p>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#fff' }}>Offers Available for LC {user.lc}</h2>
            {offers.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                No offers currently available for your LC. Wait for NC Admin to upload specific or global offers.
              </div>
            ) : (
              <div className="grid-container grid-2">
                {offers.map(offer => {
                  const isReleased = offer.releasedLcs.includes(user.lc);
                  return (
                    <div key={offer._id} className="glass-card" style={styles.offerCard}>
                      <div style={styles.cardHeader}>
                        <div>
                          <span style={styles.cardCode}>{offer.offerCode}</span>
                          <h3 style={styles.cardTitle}>{offer.title}</h3>
                        </div>
                        <span className={offer.lcScope === 'GLOBAL' ? 'badge badge-global' : 'badge badge-specific'}>
                          {offer.lcScope}
                        </span>
                      </div>

                      <div style={styles.infoRowGrid}>
                        <div style={styles.infoRowItem}>
                          <Globe size={16} />
                          <span>{offer.country}</span>
                        </div>
                        <div style={styles.infoRowItem}>
                          <Clock size={16} />
                          <span>{offer.duration}</span>
                        </div>
                        {offer.payment && (
                          <div style={styles.infoRowItem}>
                            <DollarSign size={16} />
                            <span>{offer.payment}</span>
                          </div>
                        )}
                        <div style={styles.infoRowItem}>
                          <Briefcase size={16} />
                          <span>{offer.workType}</span>
                        </div>
                      </div>

                      <p style={styles.cardDesc}>{offer.description.substring(0, 160)}...</p>

                      <div style={styles.cardActionRow}>
                        {isReleased ? (
                          <>
                            <span className="badge badge-success">Released for Students</span>
                            <button 
                              onClick={() => handleUnreleaseOffer(offer._id)}
                              className="btn btn-danger"
                              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                            >
                              Revoke Offer
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="badge badge-warning">Draft (Hidden)</span>
                            <button 
                              onClick={() => handleReleaseOffer(offer._id)}
                              className="btn btn-primary"
                              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                            >
                              Release Offer
                            </button>
                          </>
                        )}
                        <Link 
                          to={`/applications?offerId=${offer._id}`} 
                          className="btn btn-secondary" 
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          <Eye size={14} />
                          View Resumes
                        </Link>
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
              <h1 className="page-title">Explore Global Opportunities</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user.name}! Here are the offers active in your LC ({user.lc}).</p>
            </div>
            <Link to="/resume" className="btn btn-secondary">
              <BookOpen size={18} />
              Build Resume profile
            </Link>
          </div>

          {/* Resume completeness banner */}
          {(!user.resume || !user.resume.isCompleted) && (
            <div className="glass-card animate-slide-up" style={styles.resumeBanner}>
              <AlertCircle size={24} color="var(--warning)" />
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#fff', marginBottom: '4px' }}>Complete your Resume Profile!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  You must fill out your profile details (education, experiences, skills) so that LC Admins can collect it when you apply.
                </p>
              </div>
              <Link to="/resume" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Build Profile
              </Link>
            </div>
          )}

          {/* Student Job Board */}
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#fff' }}>Released Offers in LC {user.lc}</h2>
            
            {offers.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                There are no offers released in your LC at the moment. Please check back later.
              </div>
            ) : (
              <div className="grid-container grid-2">
                {offers.map(offer => {
                  const appStatus = getApplicationStatus(offer._id);
                  return (
                    <div key={offer._id} className="glass-card animate-slide-up" style={styles.offerCard}>
                      <div style={styles.cardHeader}>
                        <div>
                          <span style={styles.cardCode}>{offer.offerCode}</span>
                          <h3 style={styles.cardTitle}>{offer.title}</h3>
                        </div>
                        <span className="badge badge-global">
                          {offer.country}
                        </span>
                      </div>

                      <div style={styles.infoRowGrid}>
                        <div style={styles.infoRowItem}>
                          <Clock size={16} />
                          <span>{offer.duration}</span>
                        </div>
                        {offer.payment && (
                          <div style={styles.infoRowItem}>
                            <DollarSign size={16} />
                            <span>{offer.payment}</span>
                          </div>
                        )}
                        <div style={styles.infoRowItem}>
                          <Briefcase size={16} />
                          <span>{offer.workType}</span>
                        </div>
                      </div>

                      <div style={{ margin: '14px 0' }}>
                        <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '4px' }}>Job Description:</h4>
                        <p style={styles.cardDesc}>{offer.description}</p>
                      </div>

                      {offer.requirements && (
                        <div style={{ margin: '14px 0' }}>
                          <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '4px' }}>Requirements:</h4>
                          <p style={styles.cardDesc}>{offer.requirements}</p>
                        </div>
                      )}

                      <div style={styles.cardActionRowStudent}>
                        {appStatus ? (
                          <div style={styles.appliedStatusWrapper}>
                            <UserCheck size={18} color="var(--success)" />
                            <span style={{ fontWeight: '600' }}>
                              Applied ({appStatus})
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApply(offer._id)}
                            className="btn btn-primary"
                            disabled={submittingApp === offer._id}
                            style={{ padding: '10px 18px', width: '100%', justifyContent: 'center' }}
                          >
                            {submittingApp === offer._id ? 'Submitting Application...' : 'Quick Apply with Resume'}
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    padding: '16px',
    marginBottom: '24px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  statValue: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#fff',
  },
  formCard: {
    padding: '30px',
    marginBottom: '30px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  emptyCard: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  actionDeleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '6px',
    transition: 'var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    }
  },
  offerCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    backgroundColor: 'rgba(21, 28, 44, 0.5)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  cardCode: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--primary)',
    letterSpacing: '0.05em',
  },
  cardTitle: {
    fontSize: '1.2rem',
    color: '#fff',
    marginTop: '2px',
  },
  infoRowGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  infoRowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  cardActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    gap: '10px',
  },
  cardActionRowStudent: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  appliedStatusWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '10px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    fontSize: '0.95rem',
  },
  resumeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    borderLeft: '4px solid var(--warning)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    marginBottom: '30px',
    flexWrap: 'wrap',
  }
};

export default Dashboard;
