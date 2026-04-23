import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const WinnersPage = () => {
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const fileRef = useRef();

  const fetchWinnings = async () => {
    try {
      const res = await API.get('/winners/my');
      setWinnings(res.data.data);
    } catch { toast.error('Failed to load winnings'); }
    setLoading(false);
  };

  useEffect(() => { fetchWinnings(); }, []);

  const handleProofUpload = async (winnerId) => {
    const file = fileRef.current?.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('proof', file);
    setUploadingId(winnerId);
    try {
      await API.post(`/winners/${winnerId}/proof`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Proof uploaded! Awaiting admin review.');
      fetchWinnings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    setUploadingId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const totalWon = winnings.filter(w => w.paymentStatus === 'paid').reduce((a, w) => a + w.prizeAmount, 0);
  const pending  = winnings.filter(w => w.paymentStatus === 'pending');

  return (
    <div style={{ padding:'40px 0 80px' }}>
      <div className="container container-sm">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:'2.2rem', marginBottom:8 }}>My Winnings</h1>
          <p style={{ color:'var(--text-muted)' }}>Track your prize history and upload proof for pending claims.</p>
        </motion.div>

        {/* Summary */}
        <div className="grid-3" style={{ marginBottom:28 }}>
          {[
            { label:'Total Prizes', value:winnings.length, sub:'draws won', color:'var(--text)' },
            { label:'Total Paid Out', value:`₹${totalWon.toFixed(2)}`, sub:'confirmed', color:'var(--green)' },
            { label:'Pending Claims', value:pending.length, sub:'awaiting review', color:'var(--gold)' },
          ].map(({ label, value, sub, color }) => (
            <motion.div key={label} initial={{ opacity:0 }} animate={{ opacity:1 }} className="card">
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.8rem', color, marginBottom:2 }}>{value}</div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-dim)' }}>{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }} onChange={() => uploadingId && handleProofUpload(uploadingId)} />

        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading…</div>
        ) : winnings.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'64px 24px' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:16 }}>🏆</div>
            <h3 style={{ marginBottom:10 }}>No Wins Yet</h3>
            <p style={{ color:'var(--text-muted)' }}>Keep entering scores and you'll be here soon!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {winnings.map((w, i) => (
              <motion.div key={w._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
                  <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%', flexShrink:0,
                      background: w.matchType === '5-match' ? 'var(--gold-glow)' : 'var(--green-glow)',
                      border: `2px solid ${w.matchType === '5-match' ? 'var(--gold)' : 'var(--green)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem',
                    }}>
                      {w.matchType === '5-match' ? '🏆' : w.matchType === '4-match' ? '🥈' : '🥉'}
                    </div>
                    <div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.05rem' }}>
                          {w.draw?.month && `${new Date(w.draw?.drawDate).toLocaleString('default', { month:'long', year:'numeric' })} Draw`}
                        </span>
                        <span className={`badge ${w.matchType==='5-match'?'badge-gold':'badge-green'}`}>{w.matchType}</span>
                      </div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.6rem', color:'var(--green)' }}>
                        ₹{w.prizeAmount?.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <span className={`badge ${
                        w.verificationStatus==='approved' ? 'badge-green' :
                        w.verificationStatus==='rejected' ? 'badge-red' : 'badge-gray'
                      }`}>
                        {w.verificationStatus === 'approved' ? '✓ Verified' : w.verificationStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                      </span>
                      {w.verificationStatus === 'approved' && (
                        <span className={`badge ${w.paymentStatus==='paid'?'badge-green':'badge-gold'}`}>
                          {w.paymentStatus === 'paid' ? '₹ Paid' : '⏳ Payment Pending'}
                        </span>
                      )}
                    </div>

                    {/* Proof upload */}
                    {w.verificationStatus === 'pending' && !w.proofImage && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setUploadingId(w._id); fileRef.current.click(); }}
                        disabled={uploadingId === w._id}
                      >
                        {uploadingId === w._id ? 'Uploading…' : '📎 Upload Proof'}
                      </button>
                    )}
                    {w.proofImage && (
                      <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>✓ Proof submitted</span>
                    )}
                    {w.verificationStatus === 'rejected' && w.rejectionReason && (
                      <div style={{ fontSize:'0.8rem', color:'var(--red)', maxWidth:220, textAlign:'right' }}>
                        Reason: {w.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnersPage;
