import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: '#000' }}>G</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>Golf<span style={{ color: 'var(--green)' }}>Draw</span></span>
          </Link>
          <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 36 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--green)' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem', padding: 4 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--green)', fontWeight: 600 }}>Create one</Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-raise)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Demo Credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Admin', email: 'admin@golfdraw.com', pass: 'Admin@123456' },
                { label: 'User', email: 'james@example.com', pass: 'Password@123' },
              ].map(({ label, email, pass }) => (
                <button key={label} type="button" onClick={() => setForm({ email, password: pass })}
                  style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', transition: 'border-color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{label}:</span> {email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
