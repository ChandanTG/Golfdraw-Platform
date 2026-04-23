import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const Scores = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ score: '', date: new Date().toISOString().split('T')[0], course: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const hasActiveSub = user?.subscription?.status === 'active';

  const fetchScores = async () => {
    try {
      const res = await API.get('/scores');
      setScores(res.data.data);
    } catch { toast.error('Failed to load scores'); }
    setLoading(false);
  };

  useEffect(() => { fetchScores(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ score: '', date: new Date().toISOString().split('T')[0], course: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditId(s._id);
    setForm({ score: s.score, date: s.date.split('T')[0], course: s.course || '', notes: s.notes || '' });
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.score || form.score < 1 || form.score > 45) { toast.error('Score must be 1–45'); return; }
    setSubmitting(true);
    try {
      if (editId) {
        await API.put(`/scores/${editId}`, { score: +form.score, course: form.course, notes: form.notes });
        toast.success('Score updated');
      } else {
        await API.post('/scores', { ...form, score: +form.score });
        toast.success('Score added!');
      }
      setShowForm(false);
      fetchScores();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save score');
    }
    setSubmitting(false);
  };

  const deleteScore = async id => {
    if (!window.confirm('Delete this score?')) return;
    try {
      await API.delete(`/scores/${id}`);
      toast.success('Score deleted');
      fetchScores();
    } catch { toast.error('Failed to delete'); }
  };

  if (!hasActiveSub) return (
    <div style={{ padding:'80px 0', textAlign:'center' }}>
      <div className="container container-sm">
        <div style={{ fontSize:'3rem', marginBottom:16 }}>🔒</div>
        <h2 style={{ marginBottom:12 }}>Subscription Required</h2>
        <p style={{ color:'var(--text-muted)', marginBottom:28 }}>You need an active subscription to track and enter scores.</p>
        <a href="/subscribe" className="btn btn-primary">Subscribe Now →</a>
      </div>
    </div>
  );

  return (
    <div style={{ padding:'40px 0 80px' }}>
      <div className="container container-sm">
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:36 }}>
          <div>
            <h1 style={{ fontSize:'2rem', marginBottom:6 }}>My Scores</h1>
            <p style={{ color:'var(--text-muted)' }}>Track your last 5 Stableford scores (1–45)</p>
          </div>
          {scores.length < 5 && (
            <button onClick={openAdd} className="btn btn-primary">+ Add Score</button>
          )}
        </div>

        {/* Score count indicator */}
        <div className="card" style={{ marginBottom:24, background:'var(--bg-raise)' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                flex:1, height:6, borderRadius:3,
                background: scores.length >= i ? 'var(--green)' : 'var(--border)',
                transition:'background 0.3s',
              }} />
            ))}
            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginLeft:8, whiteSpace:'nowrap' }}>
              {scores.length}/5 scores
            </span>
          </div>
          {scores.length === 5 && (
            <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginTop:10 }}>
              ✅ Fully stocked! Adding a new score will replace the oldest one.
            </p>
          )}
          {scores.length < 3 && (
            <p style={{ color:'var(--gold)', fontSize:'0.82rem', marginTop:10 }}>
              ⚠️ You need at least 3 scores to be eligible for the monthly draw.
            </p>
          )}
        </div>

        {/* Score list */}
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading scores…</div>
        ) : scores.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'64px 24px' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:16 }}>⛳</div>
            <h3 style={{ marginBottom:10 }}>No Scores Yet</h3>
            <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Start logging your Stableford scores to enter the monthly draw.</p>
            <button onClick={openAdd} className="btn btn-primary">Add Your First Score</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <AnimatePresence>
              {scores.map((s, i) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity:0, x:-16 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:16 }}
                  transition={{ delay:i*0.05 }}
                  className="card"
                  style={{ display:'flex', alignItems:'center', gap:16 }}
                >
                  <div style={{
                    width:58, height:58, borderRadius:'50%', flexShrink:0,
                    background: i === 0 ? 'var(--green)' : 'var(--bg-raise)',
                    border: `2px solid ${i===0?'var(--green)':'var(--border)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.3rem',
                    color: i===0 ? '#000' : 'var(--text)',
                  }}>{s.score}</div>

                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontWeight:600 }}>{s.course || 'Round played'}</span>
                      {i === 0 && <span className="badge badge-green">Latest</span>}
                      {i === scores.length - 1 && scores.length === 5 && <span className="badge badge-gray">Oldest — next to go</span>}
                    </div>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                      {new Date(s.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' })}
                    </div>
                    {s.notes && <div style={{ fontSize:'0.8rem', color:'var(--text-dim)', marginTop:3 }}>{s.notes}</div>}
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => openEdit(s)} className="btn btn-outline btn-sm">Edit</button>
                    <button onClick={() => deleteScore(s._id)} className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)' }}>Delete</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {scores.length === 5 && (
          <div style={{ textAlign:'center', marginTop:20 }}>
            <button onClick={openAdd} className="btn btn-outline">Replace Oldest Score</button>
          </div>
        )}
      </div>

      {/* Score form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            className="modal-backdrop"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ scale:0.92, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.92, opacity:0 }}
              className="modal"
            >
              <div className="modal-header">
                <span className="modal-title">{editId ? 'Edit Score' : 'Add Score'}</span>
                <button onClick={() => setShowForm(false)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
              </div>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div className="form-group">
                  <label className="form-label">Stableford Score (1–45)</label>
                  <input
                    className="form-input"
                    type="number" min={1} max={45}
                    value={form.score} onChange={e => setForm(f=>({...f,score:e.target.value}))}
                    placeholder="e.g. 28"
                    required
                    style={{ fontSize:'1.5rem', fontFamily:'var(--font-display)', textAlign:'center', fontWeight:700 }}
                  />
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                    {[10,15,20,25,28,30,32,35].map(v => (
                      <button key={v} type="button" className={`btn btn-sm ${+form.score===v?'btn-primary':'btn-outline'}`}
                        onClick={() => setForm(f=>({...f,score:v}))}>{v}</button>
                    ))}
                  </div>
                </div>
                {!editId && (
                  <div className="form-group">
                    <label className="form-label">Date of Round</label>
                    <input
                      className="form-input" type="date"
                      value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))}
                      max={new Date().toISOString().split('T')[0]} required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Course (optional)</label>
                  <input className="form-input" value={form.course} onChange={e => setForm(f=>({...f,course:e.target.value}))} placeholder="e.g. St Andrews Old Course" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder="Great round despite the wind…" />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <button type="button" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={submitting}>
                    {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Add Score'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scores;
