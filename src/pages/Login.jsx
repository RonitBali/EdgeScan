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
      <div style={styles.card}>
        <h1 style={styles.title}>📄 Document Scanner</h1>
        <p style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <div style={styles.demoBanner}>
          <div style={styles.demoHeader}>🎯 Test Credentials</div>
          <div style={styles.demoContent}>
            <div style={styles.demoCredentials}>
              <div><strong>Email:</strong> demo@test.com</div>
              <div><strong>Password:</strong> demo123</div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              style={styles.demoButton}
              disabled={loading}
            >
              Use Demo Account
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
          <span style={styles.googleIcon}>🔍</span>
          Continue with Google
        </button>

        <div style={styles.toggle}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
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
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '2rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  toggle: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
  },
  toggleButton: {
    marginLeft: '0.5rem',
    color: '#3498db',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.9rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '1.5rem 0',
    '::before': {
      content: '',
      flex: 1,
      borderBottom: '1px solid #ddd',
    },
    '::after': {
      content: '',
      flex: 1,
      borderBottom: '1px solid #ddd',
    },
  },
  dividerText: {
    padding: '0 10px',
    color: '#999',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  googleButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  googleIcon: {
    fontSize: '1.2rem',
  },
  demoBanner: {
    backgroundColor: '#e3f2fd',
    border: '2px solid #2196f3',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    marginTop: '1rem',
  },
  demoHeader: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: '0.75rem',
    textAlign: 'center',
  },
  demoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  demoCredentials: {
    backgroundColor: 'white',
    padding: '0.75rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    lineHeight: '1.6',
  },
  demoButton: {
    padding: '10px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
};
