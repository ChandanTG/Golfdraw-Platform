import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const AdminDraws = () => {
  const [draws, setDraws]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [simResult, setSimResult]   = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [schedForm, setSchedForm]   = useState({
    month: new Date().getMonth()+1, year: new Date().getFullYear(),
    drawDate: new Date().toISOString().split('T')[0], drawMethod: 'random'
  });

  const fetchDraws = async () => {
    try {
      const res = await API.get('/draws?limit=12');
      setDraws(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDraws(); }, []);

  const scheduleDraw = async e => {
    e.preventDefault();
    try {
      await API.post('/draws/schedule', schedForm);
      toast.success('Draw scheduled!');
      setShowSchedule(false);
      fetchDraws();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to schedule'); }
  };

  const simulate = async id => {
    setActionLoading(`sim-${id}`);
    setSimResult(null);
    try {
      const res = await API.post(`/draws/${id}/simulate`);
      setSimResult({ drawId: id, ...res.data });
      toast.success('Simulation complete!');
    } catch (err) { toast.error(err.response?.data?.error || 'Simulation failed'); }
    setActionLoading('');
  };

  const execute = async id => {
    if (!window.confirm('Execute this draw? This will generate real winning numbers.')) return;
    setActionLoading(`exec-${id}`);
    try {
      await API.post(`/draws/${id}/execute`);
      toast.success('Draw executed!');
      fetchDraws();
    } catch (err) { toast.error(err.response?.data?.error || 'Execution failed'); }
    setActionLoading('');
  };

  const publish = async id => {
    if (!window.confirm('Publish results? Winners will be notified and results become public.')) return;
    setActionLoading(`pub-${id}`);
    try {
      await API.post(`/draws/${id}/publish`);
      toast.success('Draw published!');
      fetchDraws();
    } catch (err) { toast.error(err.response?.data?.error || 'Publish failed'); }
    setActionLoading('');
  };

  const statusColor = s => s==='published'?'badge-green':s==='executed'?'badge-gold':s==='scheduled'?'badge-blue':'badge-gray';

  return (
    <AdminLayout title="Draw Management">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:24 }}>
        <button onClick={() => setShowSchedule(true)} className="btn btn-primary">+ Schedule Draw</button>
      </div>

      {/* Sim result */}
      <AnimatePresence>
        {simResult && (
          <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="card" style={{ marginBottom:24, border:'1px solid var(--gold)', background:'var(--gold-glow)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, marginBottom:12, color:'var(--gold)' }}>🎯 Simulation Result</div>
                <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                  {simResult.data?.winningNumbers?.map(n => (
                    <div key={n.position} style={{ width:40, height:40, borderRadius:'50%', background:'var(--green)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{n.value}</div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:20, fontSize:'0.88rem', color:'var(--text-muted)', flexWrap:'wrap' }}>
                  <span>5-Match: <strong style={{ color:'var(--gold)' }}>{simResult.data?.winners?.fiveMatch}</strong></span>
                  <span>4-Match: <strong style={{ color:'var(--green)' }}>{simResult.data?.winners?.fourMatch}</strong></span>
                  <span>3-Match: <strong style={{ color:'var(--blue)' }}>{simResult.data?.winners?.threeMatch}</strong></span>
                  <span>Total Pool: <strong>₹{simResult.data?.prizePool?.total?.toFixed(2)}</strong></span>
                  {simResult.data?.prizePool?.jackpotRollover > 0 && (
                    <span style={{ color:'var(--gold)' }}>Rollover: ₹{simResult.data.prizePool.jackpotRollover.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setSimResult(null)} style={{ color:'var(--text-muted)', fontSize:'1.2rem', padding:'4px 8px' }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ color:'var(--text-muted)', padding:48, textAlign:'center' }}>Loading draws…</div>
      ) : draws.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:56 }}>
          <div style={{ fontSize:'3rem', marginBottom:16 }}>🎯</div>
          <h3 style={{ marginBottom:10 }}>No Draws Yet</h3>
          <p style={{ color:'var(--text-muted)', marginBottom:20 }}>Schedule the first monthly draw to get started.</p>
          <button onClick={() => setShowSchedule(true)} className="btn btn-primary">Schedule Now →</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {draws.map((d, i) => (
            <motion.div key={d._id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
                <div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                    <h3 style={{ fontSize:'1.1rem' }}>
                      {new Date(0, d.month-1).toLocaleString('default', {month:'long'})} {d.year}
                    </h3>
                    <span className={`badge ${statusColor(d.status)}`}>{d.status}</span>
                    <span className="badge badge-gray">{d.drawMethod}</span>
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', display:'flex', gap:20, flexWrap:'wrap' }}>
                    <span>Draw date: {new Date(d.drawDate).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>
                    <span>Participants: {d.totalParticipants || '—'}</span>
                    {d.prizePool?.total > 0 && <span>Prize pool: ₹{d.prizePool.total.toFixed(2)}</span>}
                  </div>
                  {d.winningNumbers?.length > 0 && (
                    <div style={{ display:'flex', gap:6, marginTop:10 }}>
                      {d.winningNumbers.map(n => (
                        <div key={n.position} style={{ width:32, height:32, borderRadius:'50%', background:'var(--green)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:700 }}>{n.value}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(d.status === 'scheduled' || d.status === 'executed') && (
                    <button onClick={() => simulate(d._id)} className="btn btn-outline btn-sm" disabled={actionLoading === `sim-${d._id}`}>
                      {actionLoading === `sim-${d._id}` ? '…' : '🔮 Simulate'}
                    </button>
                  )}
                  {d.status === 'scheduled' && (
                    <button onClick={() => execute(d._id)} className="btn btn-sm" style={{ background:'var(--blue)', color:'#fff' }} disabled={actionLoading === `exec-${d._id}`}>
                      {actionLoading === `exec-${d._id}` ? '…' : '▶️ Execute'}
                    </button>
                  )}
                  {d.status === 'executed' && (
                    <button onClick={() => publish(d._id)} className="btn btn-primary btn-sm" disabled={actionLoading === `pub-${d._id}`}>
                      {actionLoading === `pub-${d._id}` ? '…' : '📢 Publish'}
                    </button>
                  )}
                  {d.status === 'published' && (
                    <span className="badge badge-green">✓ Published</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Schedule modal */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowSchedule(false); }}>
            <motion.div initial={{ scale:0.92 }} animate={{ scale:1 }} exit={{ scale:0.92 }} className="modal">
              <div className="modal-header">
                <span className="modal-title">Schedule Draw</span>
                <button onClick={() => setShowSchedule(false)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
              </div>
              <form onSubmit={scheduleDraw} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-input" value={schedForm.month} onChange={e => setSchedForm(f=>({...f,month:+e.target.value}))}>
                      {Array.from({length:12},(_,i)=>i+1).map(m => (
                        <option key={m} value={m}>{new Date(0,m-1).toLocaleString('default',{month:'long'})}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input className="form-input" type="number" value={schedForm.year} onChange={e => setSchedForm(f=>({...f,year:+e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Draw Date</label>
                  <input className="form-input" type="date" value={schedForm.drawDate} onChange={e => setSchedForm(f=>({...f,drawDate:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Draw Method</label>
                  <select className="form-input" value={schedForm.drawMethod} onChange={e => setSchedForm(f=>({...f,drawMethod:e.target.value}))}>
                    <option value="random">Random</option>
                    <option value="frequency">Frequency-based (uses common scores)</option>
                  </select>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowSchedule(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }}>Schedule Draw</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDraws;
