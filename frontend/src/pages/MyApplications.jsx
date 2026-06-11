import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Calendar, Globe, Clock, DollarSign, Briefcase, CheckCircle, Award, Sparkles, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyApplications = () => {
  const { authFetch } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/api/applications/my');
      setApplications(data);
    } catch (err) {
      console.error('Error fetching student applications:', err);
      setError('Failed to fetch applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SELECTED':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Award size={12} /> Selected Winner</span>;
      case 'NOMINATED':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Sparkles size={12} /> Nominated Candidate</span>;
      case 'NOT_SELECTED':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Not Selected</span>;
      case 'ACCEPTED':
        return <span className="badge badge-success">Accepted</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      case 'REVIEWING':
        return <span className="badge badge-warning">Reviewing</span>;
      case 'APPLIED':
      default:
        return <span className="badge badge-specific">Applied</span>;
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Nominations</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track the real-time status of placement applications you have submitted</p>
        </div>
        <Link to="/" className="btn btn-primary">
          Explore Placements
        </Link>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading your nominations...</p>
      ) : applications.length === 0 ? (
        <div className="glass-card" style={styles.emptyCard}>
          <Layers size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '600' }}>No Active Nominations</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '400px' }}>
            You have not applied to any internship placements yet. Go back to the placement board to find open listings.
          </p>
          <Link to="/" className="btn btn-secondary">Browse Open Listings</Link>
        </div>
      ) : (
        <div style={styles.appsList}>
          {applications.map(app => {
            const offer = app.offerId;
            if (!offer) return null; // safety check
            
            return (
              <div key={app._id} className="glass-card animate-slide-up" style={styles.appCard}>
                <div style={styles.appHeader}>
                  <div>
                    <span style={styles.appCode}>{offer.offerCode}</span>
                    <h3 style={styles.appTitle}>{offer.title}</h3>
                  </div>
                  <div style={styles.badgeWrapper}>
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <Globe size={14} color="var(--primary)" />
                    <span>{offer.country}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Clock size={14} color="var(--primary)" />
                    <span>{offer.duration}</span>
                  </div>
                  {offer.payment && (
                    <div style={styles.detailItem}>
                      <DollarSign size={14} color="var(--primary)" />
                      <span>{offer.payment}</span>
                    </div>
                  )}
                  <div style={styles.detailItem}>
                    <Briefcase size={14} color="var(--primary)" />
                    <span>{offer.workType}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>

                {app.status === 'SELECTED' && (
                  <div style={styles.congratsBanner}>
                    <CheckCircle size={18} color="var(--success)" />
                    <span style={{ fontWeight: '600' }}>
                      Congratulations! You have been selected as the winner for this placement. The National/Local Committee will contact you shortly with travel and visa documentation steps.
                    </span>
                  </div>
                )}

                {app.status === 'NOMINATED' && (
                  <div style={styles.nominationBanner}>
                    <Sparkles size={18} color="var(--warning)" />
                    <span style={{ fontWeight: '600' }}>
                      Your application has been nominated by your LC Admin. The National Committee (NC) is currently reviewing the nominations to select the final winner.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '30px 24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '12px 16px',
    marginBottom: '20px',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 30px',
    textAlign: 'center',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
  },
  appsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  appCard: {
    padding: '24px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'var(--transition-normal)',
  },
  appHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  appCode: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: 'var(--primary)',
    letterSpacing: '0.05em',
  },
  appTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    marginTop: '2px',
    fontWeight: '600',
  },
  badgeWrapper: {
    fontSize: '0.9rem',
  },
  detailsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  congratsBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    fontSize: '0.9rem',
  },
  nominationBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--warning)',
    fontSize: '0.9rem',
  }
};

export default MyApplications;
