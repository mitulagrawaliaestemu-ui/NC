import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const ResetTempPassword = () => {
  const { resetTempPassword, logout } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const result = await resetTempPassword(password);
    setSubmitting(false);

    if (result.success) {
      setStatus('Password updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } else {
      setError(result.message || 'Failed to update password');
    }
  };

  return (
    <div style={styles.pageContainer} className="animate-fade-in">
      <div style={styles.card} className="glass-card">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Lock size={32} color="var(--primary)" />
          </div>
          <h2 style={styles.title}>Activate Account</h2>
          <p style={styles.subtitle}>Please choose a permanent password to secure your new account.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {status && (
          <div style={styles.successAlert}>
            <CheckCircle size={18} />
            <span>{status}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input 
              className="form-input"
              type="password" 
              id="newPassword" 
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <input 
              className="form-input"
              type="password" 
              id="confirmPassword" 
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Updating Password...' : 'Save & Activate Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="btn btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', width: '100%' }}
          >
            Cancel and Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px',
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--primary-glow)',
    marginBottom: '16px',
    border: '1px solid rgba(5, 60, 94, 0.2)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--primary)',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
    padding: '12px 16px',
    fontSize: '0.88rem',
    marginBottom: '20px',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    padding: '12px 16px',
    fontSize: '0.88rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
  }
};

export default ResetTempPassword;
