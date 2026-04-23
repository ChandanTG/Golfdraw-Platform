import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    charityId: '', charityPercent: 10,
    plan: searchParams.get('plan') || 'monthly'
  });
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    API.get('/charities').then(r => setCharities(r.data.data)).catch(() => {});
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'charityPercent' ? Math.max(10, Math.min(100, +value)) : value }));
  };

  const nextStep = e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setStep(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { confirmPassword, plan, ...rest } = form;
      await register(rest);
      toast.success('Account created! Welcome to GolfDraw 🎉');
      navigate('/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ position: 'fixed', top: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} style={{ width:'100%', maxWidth:480 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:28 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem', color:'#000' }}>G</div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem' }}>Golf<span style={{ color:'var(--green)' }}>Draw</span></span>
          </Link>
          <h1 style={{ fontSize:'2rem', marginBottom:8 }}>Create your account</h1>
          <p style={{ color:'var(--text-muted)' }}>Step {step} of 2 — {step === 1 ? 'Account Details' : 'Choose Your Charity'}</p>
          {/* Progress bar */}
          <div style={{ height:3, background:'var(--border)', borderRadius:2, marginTop:16 }}>
            <motion.div animate={{ width: step === 1 ? '50%' : '100%' }} style={{ height:'100%', background:'var(--green)', borderRadius:2 }} transition={{ duration:0.4 }} />
          </div>
        </div>

        <div className="card" style={{ padding:36 }}>
          {step === 1 ? (
            <form onSubmit={nextStep} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="James Wilson" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required />
                <span className="form-hint">Must contain uppercase, lowercase and a number</span>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14, marginTop:4 }}>
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label className="form-label" style={{ display:'block', marginBottom:12 }}>Select Your Charity</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                  {charities.map(c => (
                    <label key={c._id} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'12px 14px', borderRadius:'var(--radius)',
                      border:`1px solid ${form.charityId === c._id ? 'var(--green)' : 'var(--border)'}`,
                      background: form.charityId === c._id ? 'var(--green-glow)' : 'var(--bg-raise)',
                      cursor:'pointer', transition:'all 0.2s',
                    }}>
                      <input type="radio" name="charityId" value={c._id} checked={form.charityId === c._id} onChange={handleChange} style={{ accentColor:'var(--green)' }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:'0.93rem' }}>{c.name}</div>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{c.shortDescription}</div>
                      </div>
                      <span className="badge badge-gray" style={{ fontSize:'0.7rem' }}>{c.category}</span>
                    </label>
                  ))}
                </div>
                {!form.charityId && <p className="form-hint" style={{ marginTop:8 }}>Charity selection is optional but encouraged.</p>}
              </div>

              {form.charityId && (
                <div className="form-group">
                  <label className="form-label">Contribution % (min 10%)</label>
                  <input className="form-input" type="number" name="charityPercent" value={form.charityPercent} onChange={handleChange} min={10} max={100} />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                    {[10,15,20,25,50].map(v => (
                      <button key={v} type="button" onClick={() => setForm(f=>({...f,charityPercent:v}))}
                        className={`btn btn-sm ${form.charityPercent===v?'btn-primary':'btn-outline'}`}>
                        {v}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:12 }}>
                <button type="button" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center', padding:14 }} disabled={loading}>
                  {loading ? 'Creating account…' : 'Create Account 🎉'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:'0.88rem' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--green)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
