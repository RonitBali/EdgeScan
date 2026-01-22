import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const fillDemoCredentials = () => {
    setEmail('demo@test.com');
    setPassword('demo123');
    setIsSignUp(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const result = await signInWithGoogle();

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/upload');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/upload');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.branding}>
          <div style={styles.logo}>EdgeScan</div>
          <h1 style={styles.heroTitle}>Professional Document Processing</h1>
          <p style={styles.heroSubtitle}>
            Transform your documents with intelligent image enhancement and secure cloud storage
          </p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div style={styles.featureText}>Smart Enhancement</div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div style={styles.featureText}>Secure Storage</div>
            </div>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>✓</div>
              <div style={styles.featureText}>PDF Support</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <h2 style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={styles.subtitle}>
            {isSignUp ? 'Get started with your free account' : 'Sign in to access your documents'}
          </p>

          <div style={styles.demoBanner}>
            <div style={styles.demoHeader}>Demo Credentials</div>
            <div style={styles.demoContent}>
              <div style={styles.demoCredentials}>
                <div style={styles.demoField}>
                  <span style={styles.demoLabel}>Email:</span>
                  <span style={styles.demoValue}>demo@test.com</span>
                </div>
                <div style={styles.demoField}>
                  <span style={styles.demoLabel}>Password:</span>
                  <span style={styles.demoValue}>demo123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                style={styles.demoButton}
                disabled={loading}
              >
                Auto-fill Demo Credentials
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={{
            ...styles.googleButton,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          disabled={loading}
          type="button"
        >
          <svg style={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.toggle}>
          <span style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            style={styles.toggleButton}
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    backgroundColor: '#f9fafb',
  },
  leftPanel: {
    flex: '1',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  branding: {
    color: 'white',
    maxWidth: '500px',
    zIndex: 1,
  },
  logo: {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '2rem',
    letterSpacing: '-1px',
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '1.5rem',
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    opacity: '0.9',
    lineHeight: '1.6',
    marginBottom: '3rem',
    fontWeight: '400',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  featureIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: '1.1rem',
    fontWeight: '500',
  },
  rightPanel: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  formCard: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#111827',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6b7280',
    marginBottom: '2rem',
    fontWeight: '400',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    letterSpacing: '0.3px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
  },
  button: {
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem 0',
    width: '100%',
  },
  dividerText: {
    padding: '0 1rem',
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: 'white',
    position: 'relative',
    zIndex: 1,
    margin: '0 auto',
  },
  googleButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  googleIcon: {
    display: 'block',
  },
  toggle: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
  },
  toggleText: {
    color: '#6b7280',
  },
  toggleButton: {
    marginLeft: '0.5rem',
    color: '#667eea',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'underline',
  },
  error: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  demoBanner: {
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  demoHeader: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  demoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  demoCredentials: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  demoField: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
  },
  demoLabel: {
    color: '#6b7280',
    fontWeight: '500',
    minWidth: '70px',
  },
  demoValue: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  demoButton: {
    padding: '10px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
};
