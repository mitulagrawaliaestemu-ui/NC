/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Calendar, Globe, Clock, DollarSign, Briefcase, CheckCircle } from 'lucide-react';
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
          <h1 className="page-title">My Applications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track the status of all internship offers you have applied to</p>
        </div>
        <Link to="/" className="btn btn-primary">
          Explore More Offers
        </Link>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Loading your applications...</p>
      ) : applications.length === 0 ? (
        <div className="glass-card" style={styles.emptyCard}>
          <Layers size={36} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>No applications yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            You haven't submitted any applications. Go to the dashboard to find available offers.
          </p>
          <Link to="/" className="btn btn-secondary">Browse Offers</Link>
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
                    <span>Applied on: {new Date(app.appliedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>

                {app.status === 'ACCEPTED' && (
                  <div style={styles.congratsBanner}>
                    <CheckCircle size={18} color="var(--success)" />
                    <span style={{ fontWeight: '500' }}>
                      Congratulations! Your application has been accepted. The Local Committee will contact you shortly with the details.
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
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
  },
  appsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  appCard: {
    padding: '24px',
    backgroundColor: 'rgba(21, 28, 44, 0.4)',
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
    color: '#fff',
    marginTop: '2px',
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
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    fontSize: '0.9rem',
  }
};

export default MyApplications;
