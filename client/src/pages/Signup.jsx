import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verifyEmailCode, loginWithGoogle, clearError } from '../redux/slices/authSlice';
import api from '../services/api';
import { GraduationCap, Lock, Mail, User, ArrowRight, BookOpen, Users, AlertCircle, Loader2 } from 'lucide-react';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' // default role
  });

  const { name, email, password, role } = formData;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  const { isAuthenticated, error, loading, user } = useSelector(
    (state) => state.auth
  );

  // Clear errors when entering signup screen
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Navigate user after successful registration
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
      dispatch(loginWithGoogle({ credential, role }));
    };

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder',
        callback: handleGoogleCallback,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        {
          theme: 'filled_blue',
          size: 'large',
          width: 360,
          text: 'signup_with',
          shape: 'rectangular',
        }
      );
    }
  }, [dispatch, role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (newRole) => {
    setFormData({ ...formData, role: newRole });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    try {
      const resultAction = await dispatch(registerUser({ name, email, password, role }));
      if (registerUser.fulfilled.match(resultAction)) {
        if (resultAction.payload?.verificationRequired) {
          setOtpSent(true);
        }
      }
    } catch (err) {
      console.error('Registration dispatch error:', err);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }
    setOtpError('');
    dispatch(verifyEmailCode({ email, code: otpCode }));
  };

  const handleResendOtp = async () => {
    try {
      setOtpError('');
      const response = await api.post('/auth/resend-verification', { email });
      if (response.data.success) {
        alert('A new verification code has been sent to your email.');
      } else {
        setOtpError(response.data.message || 'Failed to resend code');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Error resending code');
    }
  };

  if (otpSent) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel animate-fade-in" style={{ maxWidth: '460px' }}>
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <GraduationCap size={36} />
            </div>
            <h2>Verify Your Email</h2>
            <p>We have sent a 6-digit verification code to <strong>{email}</strong>. Please check your inbox.</p>
          </div>

          {error && (
            <div className="auth-error animate-fade-in">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {otpError && (
            <div className="auth-error animate-fade-in">
              <AlertCircle size={18} />
              <span>{otpError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otpCode">Verification Code</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="otpCode"
                  type="text"
                  name="otpCode"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="form-input form-input-with-icon"
                  style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.25rem' }}
                  required
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
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Activate Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleResendOtp}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              Resend Code
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setOtpSent(false);
                setOtpCode('');
                setOtpError('');
              }}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in" style={{ maxWidth: '460px' }}>
        <div className="auth-header">
          <div className="auth-logo-wrapper">
            <GraduationCap size={36} />
          </div>
          <h2>Create Account</h2>
          <p>Join SmartLMS and start learning today</p>
        </div>

        {error && (
          <div className="auth-error animate-fade-in">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label">Register As</label>
            <div className="role-selector-container">
              <div
                className={`role-option ${role === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <BookOpen size={20} />
                <span>Student</span>
                <p className="role-description">Join courses & study with AI notes</p>
              </div>

              <div
                className={`role-option ${role === 'teacher' ? 'active' : ''}`}
                onClick={() => handleRoleChange('teacher')}
              >
                <Users size={20} />
                <span>Teacher</span>
                <p className="role-description">Create private courses & evaluate submissions</p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="John Doe"
                className="form-input form-input-with-icon"
                required
              />
            </div>
          </div>

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
                placeholder="Minimum 6 characters"
                className="form-input form-input-with-icon"
                required
                minLength={6}
                autoComplete="new-password"
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">Or</div>

        <div className="flex-center" style={{ marginBottom: '20px' }}>
          <div id="google-signup-btn" className="google-auth-btn-container"></div>
        </div>

        <p className="auth-footer-text">
          Already have an account?
          <Link to="/login" className="auth-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
