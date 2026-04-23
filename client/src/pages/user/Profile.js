import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const handleChange = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const saveProfile = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/auth/updateprofile', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    setLoading(false);
  };

  const changePassword = async e => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPassLoading(true);
    try {
      await API.put('/auth/updatepassword', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update password'); }
    setPassLoading(false);
  };

  const openBillingPortal = async () => {
    try {
      const res = await API.post('/payments/billing-portal');
      window.open(res.data.url, '_blank');
    } catch { toast.error('Failed to open billing portal'); }
  };

  return (
    <div style={{ padding:'40px 0 80px' }}>
      <div className="container container-sm">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:'2.2rem', marginBottom:8 }}>Profile Settings</h1>
          <p style={{ color:'var(--text-muted)' }}>Manage your account and subscription.</p>
        </motion.div>

        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {/* Profile */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }} className="card">
            <h3 style={{ marginBottom:24, fontSize:'1.1rem' }}>Personal Information</h3>
            <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+44 7700 000000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity:0.6 }} />
                <span className="form-hint">Email cannot be changed</span>
              </div>
              <div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Subscription */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
              <div>
                <h3 style={{ marginBottom:8, fontSize:'1.1rem' }}>Subscription</h3>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span className={`badge ${user?.subscription?.status==='active'?'badge-green':user?.subscription?.status==='past_due'?'badge-gold':'badge-red'}`}>
                    {user?.subscription?.status || 'none'}
                  </span>
                  {user?.subscription?.plan && <span className="badge badge-gray">{user.subscription.plan} plan</span>}
                </div>
                {user?.subscription?.currentPeriodEnd && (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:8 }}>
                    {user.subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
                  </p>
                )}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                {user?.subscription?.status === 'active' ? (
                  <button onClick={openBillingPortal} className="btn btn-outline btn-sm">Manage Billing</button>
                ) : (
                  <a href="/subscribe" className="btn btn-primary btn-sm">Subscribe Now</a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Charity */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.25 }} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <div>
                <h3 style={{ marginBottom:6, fontSize:'1.1rem' }}>Charity Contribution</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>
                  {user?.selectedCharity?.name
                    ? <>Supporting <strong style={{ color:'var(--text)' }}>{user.selectedCharity.name}</strong> at <strong style={{ color:'var(--green)' }}>{user.charityContributionPercent}%</strong></>
                    : 'No charity selected'}
                </p>
              </div>
              <a href="/charities" className="btn btn-outline btn-sm">Change Charity</a>
            </div>
          </motion.div>

          {/* Change password */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} className="card">
            <h3 style={{ marginBottom:24, fontSize:'1.1rem' }}>Change Password</h3>
            <form onSubmit={changePassword} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {['currentPassword','newPassword','confirmPassword'].map(field => (
                <div key={field} className="form-group">
                  <label className="form-label">{{ currentPassword:'Current Password', newPassword:'New Password', confirmPassword:'Confirm New Password' }[field]}</label>
                  <input className="form-input" type="password" value={passForm[field]} onChange={e=>setPassForm(f=>({...f,[field]:e.target.value}))} placeholder="••••••••" required />
                </div>
              ))}
              <div>
                <button type="submit" className="btn btn-primary" disabled={passLoading}>
                  {passLoading ? 'Updating…' : 'Change Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
