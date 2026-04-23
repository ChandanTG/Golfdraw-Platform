import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminWinners = () => {
  const [winners, setWinners]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [vStatus, setVStatus]         = useState('');       // verification filter
  const [pStatus, setPStatus]         = useState('');       // payment filter
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payForm, setPayForm]         = useState({ paymentStatus:'paid', paymentMethod:'', paymentReference:'' });
  const [actionLoading, setActionLoading] = useState('');

  const fetchWinners = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:15 });
      if (vStatus) params.set('status', vStatus);
      if (pStatus) params.set('paymentStatus', pStatus);
      const res = await API.get(`/winners?${params}`);
      setWinners(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load winners'); }
    setLoading(false);
  }, [page, vStatus, pStatus]);

  useEffect(() => { fetchWinners(); }, [fetchWinners]);

  const verify = async (id, status) => {
    if (status === 'rejected' && !rejectReason) { toast.error('Please enter a rejection reason'); return; }
    setActionLoading(`verify-${id}`);
    try {
      await API.put(`/winners/${id}/verify`, { status, rejectionReason: status === 'rejected' ? rejectReason : undefined });
      toast.success(`Winner ${status}`);
      setSelected(null);
      setRejectReason('');
      fetchWinners();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    setActionLoading('');
  };

  const updatePayment = async (id) => {
    setActionLoading(`pay-${id}`);
    try {
      await API.put(`/winners/${id}/payment`, payForm);
      toast.success('Payment status updated');
      setSelected(null);
      fetchWinners();
    } catch { toast.error('Failed to update payment'); }
    setActionLoading('');
  };

  const matchColor = mt => mt === '5-match' ? 'badge-gold' : mt === '4-match' ? 'badge-green' : 'badge-blue';
  const verifyColor = s => s === 'approved' ? 'badge-green' : s === 'rejected' ? 'badge-red' : 'badge-gray';
  const payColor    = s => s === 'paid' ? 'badge-green' : s === 'processing' ? 'badge-blue' : s === 'failed' ? 'badge-red' : 'badge-gold';

  const pendingCount = winners.filter(w => w.verificationStatus === 'pending').length;

  return (
    <AdminLayout title="Winner Verification">
      {/* Summary strip */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:'Total Winners', value:total, color:'var(--text)' },
          { label:'Pending Review', value:winners.filter(w=>w.verificationStatus==='pending').length, color:'var(--gold)' },
          { label:'Approved', value:winners.filter(w=>w.verificationStatus==='approved').length, color:'var(--green)' },
          { label:'Paid Out', value:winners.filter(w=>w.paymentStatus==='paid').length, color:'var(--blue)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding:'16px 20px' }}>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.8rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <select className="form-input" style={{ maxWidth:180 }} value={vStatus} onChange={e=>{ setVStatus(e.target.value); setPage(1); }}>
          <option value="">All Verification</option>
          {['pending','approved','rejected'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ maxWidth:180 }} value={pStatus} onChange={e=>{ setPStatus(e.target.value); setPage(1); }}>
          <option value="">All Payments</option>
          {['pending','processing','paid','failed'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        {pendingCount > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius)', padding:'8px 14px' }}>
            <span style={{ fontSize:'0.8rem', color:'var(--gold)' }}>⚠️ {pendingCount} winner{pendingCount!==1?'s':''} awaiting review</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading…</div>
      ) : winners.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:56 }}>
          <div style={{ fontSize:'3rem', marginBottom:16 }}>🏆</div>
          <h3 style={{ marginBottom:8 }}>No Winners Found</h3>
          <p style={{ color:'var(--text-muted)' }}>Winners will appear here after draws are published.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card" style={{ padding:0, overflow:'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Winner</th><th>Draw</th><th>Match</th><th>Prize</th><th>Proof</th><th>Verification</th><th>Payment</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {winners.map(w => (
                  <tr key={w._id}>
                    <td>
                      <div style={{ fontWeight:500 }}>{w.user?.name}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{w.user?.email}</div>
                    </td>
                    <td style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>
                      {w.draw ? `${new Date(0,w.draw.month-1).toLocaleString('default',{month:'short'})} ${w.draw.year}` : '—'}
                    </td>
                    <td><span className={`badge ${matchColor(w.matchType)}`}>{w.matchType}</span></td>
                    <td style={{ fontWeight:700, color:'var(--green)' }}>₹{w.prizeAmount?.toFixed(2)}</td>
                    <td>
                      {w.proofImage
                        ? <a href={`/uploads/${w.proofImage}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ fontSize:'0.75rem' }}>View</a>
                        : <span style={{ color:'var(--text-dim)', fontSize:'0.82rem' }}>Not uploaded</span>
                      }
                    </td>
                    <td><span className={`badge ${verifyColor(w.verificationStatus)}`}>{w.verificationStatus}</span></td>
                    <td><span className={`badge ${payColor(w.paymentStatus)}`}>{w.paymentStatus}</span></td>
                    <td>
                      <button onClick={() => { setSelected(w); setPayForm({ paymentStatus:w.paymentStatus, paymentMethod:w.paymentMethod||'', paymentReference:w.paymentReference||'' }); }}
                        className="btn btn-outline btn-sm">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Page {page} of {Math.ceil(total/15)||1}</span>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-outline btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page>=Math.ceil(total/15)} onClick={()=>setPage(p=>p+1)}>Next →</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Manage modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setSelected(null); }}>
            <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }} className="modal" style={{ maxWidth:560 }}>
              <div className="modal-header">
                <span className="modal-title">Manage Winner</span>
                <button onClick={()=>setSelected(null)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
              </div>

              {/* Winner info */}
              <div style={{ background:'var(--bg-raise)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:600 }}>{selected.user?.name}</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{selected.user?.email}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.5rem', color:'var(--green)' }}>₹{selected.prizeAmount?.toFixed(2)}</div>
                    <span className={`badge ${matchColor(selected.matchType)}`}>{selected.matchType}</span>
                  </div>
                </div>
                {selected.proofImage && (
                  <a href={`/uploads/${selected.proofImage}`} target="_blank" rel="noreferrer"
                    style={{ fontSize:'0.82rem', color:'var(--blue)', display:'inline-block', marginTop:4 }}>
                    📎 View uploaded proof →
                  </a>
                )}
              </div>

              {/* Verification section */}
              {selected.verificationStatus === 'pending' && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontWeight:600, marginBottom:12 }}>Verification</div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <label className="form-label">Rejection Reason (required if rejecting)</label>
                    <input className="form-input" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="e.g. Proof image unclear or invalid" />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button
                      onClick={() => verify(selected._id, 'rejected')}
                      className="btn btn-danger"
                      style={{ flex:1, justifyContent:'center' }}
                      disabled={actionLoading===`verify-${selected._id}`}
                    >✗ Reject</button>
                    <button
                      onClick={() => verify(selected._id, 'approved')}
                      className="btn btn-primary"
                      style={{ flex:2, justifyContent:'center' }}
                      disabled={actionLoading===`verify-${selected._id}`}
                    >
                      {actionLoading===`verify-${selected._id}` ? 'Updating…' : '✓ Approve Winner'}
                    </button>
                  </div>
                </div>
              )}

              {selected.verificationStatus !== 'pending' && (
                <div style={{ marginBottom:20, padding:'10px 14px', borderRadius:'var(--radius)', background: selected.verificationStatus==='approved' ? 'var(--green-glow)' : 'rgba(239,68,68,0.08)', border:`1px solid ${selected.verificationStatus==='approved' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
                  <span style={{ color: selected.verificationStatus==='approved' ? 'var(--green)' : 'var(--red)', fontSize:'0.9rem' }}>
                    {selected.verificationStatus==='approved' ? '✓ Approved' : `✗ Rejected: ${selected.rejectionReason || 'No reason given'}`}
                  </span>
                </div>
              )}

              {/* Payment section — only if approved */}
              {selected.verificationStatus === 'approved' && (
                <div>
                  <div style={{ height:1, background:'var(--border)', marginBottom:16 }} />
                  <div style={{ fontWeight:600, marginBottom:12 }}>Payment Details</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <div className="form-group">
                      <label className="form-label">Payment Status</label>
                      <select className="form-input" value={payForm.paymentStatus} onChange={e=>setPayForm(f=>({...f,paymentStatus:e.target.value}))}>
                        {['pending','processing','paid','failed'].map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <input className="form-input" value={payForm.paymentMethod} onChange={e=>setPayForm(f=>({...f,paymentMethod:e.target.value}))} placeholder="e.g. Bank Transfer, PayPal" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Reference / Transaction ID</label>
                      <input className="form-input" value={payForm.paymentReference} onChange={e=>setPayForm(f=>({...f,paymentReference:e.target.value}))} placeholder="e.g. TXN-20240201-001" />
                    </div>
                    <button
                      onClick={() => updatePayment(selected._id)}
                      className="btn btn-primary"
                      style={{ justifyContent:'center' }}
                      disabled={actionLoading===`pay-${selected._id}`}
                    >
                      {actionLoading===`pay-${selected._id}` ? 'Saving…' : 'Update Payment Status'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminWinners;
