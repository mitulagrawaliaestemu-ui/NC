import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Globe, AlertTriangle } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.isTempPassword) {
        navigate('/reset-temp-password');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Invalid credentials');
    }
  };

  return (
    <div style={styles.pageContainer} className="animate-fade-in">
      <div style={styles.card} className="glass-card">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <Globe size={32} color="#6366f1" style={{ animation: 'spin 12s linear infinite' }} />
          </div>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your IAESTE India Portal</p>
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
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              className="form-input"
              type="email" 
              id="email" 
              placeholder="e.g. student@iaeste.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              className="form-input"
              type="password" 
              id="password" 
              placeholder="••••••••"
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
            {submitting ? 'Signing in...' : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerText}>New member? </span>
          <Link to="/register" style={styles.registerLink}>Create an Account</Link>
        </div>
      </div>
      
      {/* Demo Credentials Info Panel */}
      <div style={styles.demoInfoPanel} className="glass-card">
        <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '0.95rem' }}>Demo Access Accounts:</h4>
        <div style={styles.demoGrid}>
          <div>
            <strong>NC Admin:</strong>
            <div style={styles.demoCred}>ncadmin@iaeste.in / admin123</div>
          </div>
          <div>
            <strong>LC MU Admin:</strong>
            <div style={styles.demoCred}>muadmin@iaeste.in / admin123</div>
          </div>
          <div>
            <strong>LC MUJ Admin:</strong>
            <div style={styles.demoCred}>mujadmin@iaeste.in / admin123</div>
          </div>
          <div>
            <strong>LC KU Admin:</strong>
            <div style={styles.demoCred}>kuadmin@iaeste.in / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 100px)',
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
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    marginBottom: '16px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
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
  registerLink: {
    color: 'var(--primary)',
    fontWeight: '600',
  },
  demoInfoPanel: {
    width: '100%',
    maxWidth: '420px',
    marginTop: '24px',
    padding: '16px 20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  demoCred: {
    fontFamily: 'monospace',
    color: 'var(--accent)',
    marginTop: '2px',
  }
};

export default Login;
