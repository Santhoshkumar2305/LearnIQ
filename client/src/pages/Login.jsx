import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, loginWithGoogle, clearError } from '../redux/slices/authSlice';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, error, loading, user } = useSelector(
    (state) => state.auth
  );

  // Clear errors when entering login screen
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Navigate user after successful authorization
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'teacher' && !user.isApproved) {
        navigate('/teacher-pending');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Load and render Google OAuth Sign-in Button
  useEffect(() => {
    const handleGoogleCallback = (response) => {
      const credential = response.credential;
      // standard login doesn't send role (only for new signup accounts)
      dispatch(loginWithGoogle({ credential }));
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder',
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'filled_blue',
          size: 'large',
          width: 360,
          text: 'signin_with',
          shape: 'rectangular',
        }
      );
    }
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <GraduationCap size={36} />
          </div>
          <h2>Welcome Back</h2>
          <p>Login to resume your classes and notes</p>
        </div>

        {error && (
          <div className="auth-error animate-fade-in">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="form-input form-input-with-icon"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="form-input form-input-with-icon"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-submit-auth"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">Or</div>

        <div className="flex-center" style={{ marginBottom: '20px' }}>
          <div id="google-signin-btn" className="google-auth-btn-container"></div>
        </div>

        <p className="auth-footer-text">
          Don't have an account?
          <Link to="/signup" className="auth-link">Get Started</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
