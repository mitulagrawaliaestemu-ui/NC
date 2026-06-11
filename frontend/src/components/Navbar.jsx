import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Globe, 
  LogOut, 
  User as UserIcon, 
  FileText, 
  Briefcase, 
  Users, 
  Menu, 
  X,
  Layers
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role, lc) => {
    switch (role) {
      case 'NC_ADMIN':
        return <span className="badge badge-global">NC Admin</span>;
      case 'LC_ADMIN':
        return <span className="badge badge-specific">LC {lc} Admin</span>;
      case 'MEMBER':
        return <span className="badge badge-success">Member ({lc})</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="glass-nav" style={styles.nav}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <Globe size={24} color="var(--primary)" style={{ animation: 'spin 12s linear infinite' }} />
          <span style={styles.logoText}>IAESTE <span style={{ color: 'var(--secondary)' }}>India</span></span>
        </Link>

        {/* Desktop Navigation */}
        <div style={styles.navItems}>
          {user ? (
            <>
              {/* NC Admin Links */}
              {user.role === 'NC_ADMIN' && (
                <>
                  <Link 
                    to="/" 
                    className={isActive('/') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/') ? styles.activeLink : styles.link}
                  >
                    <Briefcase size={18} />
                    Manage Offers
                  </Link>
                  <Link 
                    to="/members" 
                    className={isActive('/members') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/members') ? styles.activeLink : styles.link}
                  >
                    <Users size={18} />
                    Manage Members
                  </Link>
                </>
              )}

              {/* LC Admin Links */}
              {user.role === 'LC_ADMIN' && (
                <>
                  <Link 
                    to="/" 
                    className={isActive('/') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/') ? styles.activeLink : styles.link}
                  >
                    <Briefcase size={18} />
                    Manage Offers
                  </Link>
                  <Link 
                    to="/applications" 
                    className={isActive('/applications') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/applications') ? styles.activeLink : styles.link}
                  >
                    <FileText size={18} />
                    Applications
                  </Link>
                </>
              )}

              {/* Member Links */}
              {user.role === 'MEMBER' && (
                <>
                  <Link 
                    to="/" 
                    className={isActive('/') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/') ? styles.activeLink : styles.link}
                  >
                    <Briefcase size={18} />
                    Explore Offers
                  </Link>
                  <Link 
                    to="/my-applications" 
                    className={isActive('/my-applications') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/my-applications') ? styles.activeLink : styles.link}
                  >
                    <Layers size={18} />
                    My Applications
                  </Link>
                  <Link 
                    to="/resume" 
                    className={isActive('/resume') ? 'nav-link active' : 'nav-link'}
                    style={isActive('/resume') ? styles.activeLink : styles.link}
                  >
                    <FileText size={18} />
                    Build Resume
                  </Link>
                </>
              )}

              <div style={styles.divider}></div>

              {/* User Identity */}
              <div style={styles.userInfo}>
                <div style={styles.userIconWrapper}>
                  <UserIcon size={16} />
                </div>
                <div style={styles.userDetail}>
                  <span style={styles.userName}>{user.name}</span>
                  {getRoleBadge(user.role, user.lc)}
                </div>
              </div>

              {/* Logout */}
              <button onClick={handleLogout} style={styles.logoutBtn} title="Log Out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.loginLink}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button style={styles.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {user ? (
            <div style={styles.mobileList}>
              <div style={styles.mobileUserHeader}>
                <span style={styles.mobileUserName}>{user.name}</span>
                {getRoleBadge(user.role, user.lc)}
              </div>
              
              {user.role === 'NC_ADMIN' && (
                <>
                  <Link to="/" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Manage Offers</Link>
                  <Link to="/members" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Manage Members</Link>
                </>
              )}
              {user.role === 'LC_ADMIN' && (
                <>
                  <Link to="/" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Manage Offers</Link>
                  <Link to="/applications" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Applications</Link>
                </>
              )}
              {user.role === 'MEMBER' && (
                <>
                  <Link to="/" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Explore Offers</Link>
                  <Link to="/my-applications" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>My Applications</Link>
                  <Link to="/resume" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Build Resume</Link>
                </>
              )}
              
              <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
                <LogOut size={16} /> Log Out
              </button>
            </div>
          ) : (
            <div style={styles.mobileList}>
              <Link to="/login" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/register" style={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border-color)',
    padding: '0 24px',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--primary)',
    letterSpacing: '-0.03em',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    fontWeight: '550',
    fontSize: '0.92rem',
    transition: 'var(--transition-fast)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
  },
  activeLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-glow)',
    fontWeight: '600',
    fontSize: '0.92rem',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(0, 59, 89, 0.1)',
  },
  divider: {
    height: '24px',
    width: '1px',
    backgroundColor: 'var(--border-color)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--primary-glow)',
    color: 'var(--primary)',
    fontWeight: '600',
  },
  userDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 'var(--radius-md)',
    transition: 'var(--transition-fast)',
    '&:hover': {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--danger)',
    }
  },
  authLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  loginLink: {
    color: 'var(--text-secondary)',
    fontWeight: '550',
    fontSize: '0.95rem',
  },
  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  mobileMenu: {
    position: 'absolute',
    top: '70px',
    left: 0,
    width: '100%',
    background: '#fff',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-lg)',
    padding: '16px 24px',
  },
  mobileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  mobileUserHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  mobileUserName: {
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  mobileLink: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    fontWeight: '550',
    padding: '4px 0',
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '8px 0',
    fontWeight: '550',
  }
};

export default Navbar;
