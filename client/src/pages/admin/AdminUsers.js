import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [selected, setSelected] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:15 });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await API.get(`/admin/users?${params}`);
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (userId, current) => {
    try {
      await API.put(`/admin/users/${userId}`, { isActive: !current });
      toast.success(`User ${!current ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const overrideSub = async (userId, newStatus) => {
    try {
      await API.put(`/admin/users/${userId}/subscription`, { status: newStatus });
      toast.success('Subscription updated');
      fetchUsers();
    } catch { toast.error('Failed to update subscription'); }
  };

  const subColor = s => s==='active'?'badge-green':s==='past_due'?'badge-gold':s==='none'||!s?'badge-gray':'badge-red';

  return (
    <AdminLayout title="User Management">
      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <input
          className="form-input" style={{ maxWidth:280 }}
          placeholder="Search name or email…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-input" style={{ maxWidth:160 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['active','cancelled','expired','none','past_due'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color:'var(--text-muted)', fontSize:'0.88rem', alignSelf:'center' }}>{total} users</span>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading…</div>
      ) : (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Subscription</th><th>Plan</th><th>Charity %</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight:500 }}>{u.name}</div>
                        <div style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{u.email}</div>
                        {!u.isActive && <span className="badge badge-red" style={{ fontSize:'0.68rem', marginTop:2 }}>Deactivated</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role==='admin'?'badge-gold':'badge-gray'}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${subColor(u.subscription?.status)}`}>{u.subscription?.status||'none'}</span>
                    </td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>{u.subscription?.plan||'—'}</td>
                    <td style={{ color:'var(--green)', fontWeight:600 }}>{u.charityContributionPercent}%</td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' })}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setSelected(u)} className="btn btn-outline btn-sm">Manage</button>
                        <button onClick={() => toggleActive(u._id, u.isActive)}
                          className="btn btn-sm"
                          style={{ background: u.isActive ? 'rgba(239,68,68,0.1)' : 'var(--green-glow)', color: u.isActive ? 'var(--red)' : 'var(--green)', border: `1px solid ${u.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Page {page} of {Math.ceil(total/15)}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page>=Math.ceil(total/15)} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User detail modal */}
      {selected && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{selected.name}</span>
              <button onClick={() => setSelected(null)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ padding:'12px 14px', background:'var(--bg-raise)', borderRadius:'var(--radius)', fontSize:'0.88rem' }}>
                <div><strong>Email:</strong> {selected.email}</div>
                <div><strong>Role:</strong> {selected.role}</div>
                <div><strong>Subscription:</strong> {selected.subscription?.status} ({selected.subscription?.plan})</div>
                <div><strong>Charity %:</strong> {selected.charityContributionPercent}%</div>
                <div><strong>Active:</strong> {selected.isActive ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom:8 }}>Override Subscription Status</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['active','cancelled','expired','none'].map(s => (
                    <button key={s} className={`btn btn-sm ${selected.subscription?.status===s?'btn-primary':'btn-outline'}`}
                      onClick={() => { overrideSub(selected._id, s); setSelected(u => ({...u, subscription:{...u.subscription,status:s}})); }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { toggleActive(selected._id, selected.isActive); setSelected(null); }}
                className={`btn ${selected.isActive ? 'btn-danger' : 'btn-primary'}`} style={{ justifyContent:'center' }}>
                {selected.isActive ? 'Deactivate Account' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
