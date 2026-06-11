import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lc, setLc] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !lc) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    const result = await register(name, email, password, lc);
    setSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <div style={styles.pageContainer} className="animate-fade-in">
      <div style={styles.card} className="glass-card">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Globe size={32} color="#a855f7" style={{ animation: 'spin 12s linear infinite' }} />
          </div>
          <h2 style={styles.title}>Join IAESTE India</h2>
          <p style={styles.subtitle}>Create a student account to apply for international offers</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input 
              className="form-input"
              type="text" 
              id="name" 
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              className="form-input"
              type="email" 
              id="email" 
              placeholder="e.g. rahul@student.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lc">Local Committee (LC)</label>
            <select 
              className="form-select"
              id="lc"
              value={lc}
              onChange={(e) => setLc(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="">Select your LC...</option>
              <option value="MU">LC MU (Manipal University)</option>
              <option value="MUJ">LC MUJ (Manipal University Jaipur)</option>
              <option value="KU">LC KU (Karunya University)</option>
              <option value="JECRC">LC JECRC (JECRC University)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              className="form-input"
              type="password" 
              id="password" 
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Creating account...' : (
              <>
                <UserPlus size={18} />
                Register Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Already registered? </span>
          <Link to="/login" style={styles.loginLink}>Sign In</Link>
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
    minHeight: 'calc(100vh - 100px)',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '445px',
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
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    marginBottom: '16px',
    border: '1px solid rgba(168, 85, 247, 0.2)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    textAlign: 'center',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--danger)',
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
    marginBottom: '20px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '0.9rem',
  },
  footerText: {
    color: 'var(--text-secondary)',
  },
  loginLink: {
    color: 'var(--primary)',
    fontWeight: '600',
  }
};

export default Register;
