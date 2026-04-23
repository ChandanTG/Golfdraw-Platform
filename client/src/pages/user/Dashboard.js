import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const StatCard = ({ label, value, sub, color = 'var(--green)', icon, delay = 0 }) => (
  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }} className="card">
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      <span style={{ fontSize:'1.4rem' }}>{icon}</span>
    </div>
    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', color, marginBottom:4 }}>{value}</div>
    {sub && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{sub}</div>}
  </motion.div>
);

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [drawHistory, setDrawHistory] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const hasActiveSub = user?.subscription?.status === 'active';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [scoresRes, drawRes, winnersRes] = await Promise.all([
          API.get('/scores'),
          API.get('/draws/current'),
          API.get('/winners/my'),
        ]);
        setScores(scoresRes.data.data);
        setCurrentDraw(drawRes.data.data);
        setWinnings(winnersRes.data.data);
        if (hasActiveSub) {
          const histRes = await API.get('/draws/my-history');
          setDrawHistory(histRes.data.data.slice(0, 3));
        }
      } catch {}
      setLoadingData(false);
    };
    fetchAll();
  }, [hasActiveSub]);

  const avgScore = scores.length ? (scores.reduce((a,s)=>a+s.score,0)/scores.length).toFixed(1) : '—';
  const totalWon = winnings.filter(w=>w.paymentStatus==='paid').reduce((a,w)=>a+w.prizeAmount,0);

  return (
    <div style={{ padding:'40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginBottom:40 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
            <div>
              <p style={{ color:'var(--text-muted)', marginBottom:4 }}>Good to see you,</p>
              <h1 style={{ fontSize:'2.2rem', marginBottom:8 }}>{user?.name} 👋</h1>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <span className={`badge ${hasActiveSub ? 'badge-green' : 'badge-red'}`}>
                  {hasActiveSub ? '● Subscription Active' : '○ No Active Subscription'}
                </span>
                {user?.subscription?.plan && (
                  <span className="badge badge-gray">{user.subscription.plan} plan</span>
                )}
              </div>
            </div>
            {!hasActiveSub && (
              <Link to="/subscribe" className="btn btn-primary">
                Subscribe to Play →
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:36 }}>
          <StatCard label="Avg Score" value={avgScore} sub={`${scores.length} scores entered`} icon="⛳" delay={0.1} />
          <StatCard label="Draw Participation" value={drawHistory.length > 0 ? `${drawHistory[0]?.matchCount || 0} matches` : '—'} sub="This month" icon="🎯" color="var(--blue)" delay={0.2} />
          <StatCard label="Total Won" value={totalWon ? `₹${totalWon.toFixed(0)}` : '₹0'} sub={`${winnings.length} prize(s)`} icon="🏆" color="var(--gold)" delay={0.3} />
          <StatCard label="Charity %" value={`${user?.charityContributionPercent || 10}%`} sub={user?.selectedCharity?.name || 'No charity selected'} icon="❤️" color="var(--red)" delay={0.4} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          {/* Scores panel */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontSize:'1.1rem' }}>My Scores</h3>
              <Link to="/scores" className="btn btn-outline btn-sm">Manage</Link>
            </div>
            {scores.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:12 }}>⛳</div>
                <p style={{ marginBottom:16 }}>No scores entered yet</p>
                {hasActiveSub && <Link to="/scores" className="btn btn-primary btn-sm">Add Your First Score</Link>}
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {scores.map((s, i) => (
                  <div key={s._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg-raise)', borderRadius:'var(--radius)' }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%', background:'var(--green-glow)',
                      border:'1px solid rgba(34,197,94,0.3)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--font-display)', fontWeight:700, color:'var(--green)',
                    }}>{s.score}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.9rem', fontWeight:500 }}>{s.course || 'Round played'}</div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</div>
                    </div>
                    {i === 0 && <span className="badge badge-green">Latest</span>}
                  </div>
                ))}
              </div>
            )}
            {scores.length < 5 && hasActiveSub && scores.length > 0 && (
              <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--radius)', fontSize:'0.82rem', color:'var(--gold)' }}>
                ⚠️ Enter {5 - scores.length} more score{5-scores.length!==1?'s':''} to maximise your draw chances
              </div>
            )}
          </motion.div>

          {/* Draw panel */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 }} className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontSize:'1.1rem' }}>Monthly Draw</h3>
              <Link to="/draw" className="btn btn-outline btn-sm">View Draw</Link>
            </div>

            {currentDraw?.status === 'published' ? (
              <div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:12 }}>This month's winning numbers:</div>
                <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
                  {currentDraw.winningNumbers?.map(n => (
                    <div key={n.position} style={{
                      width:48, height:48, borderRadius:'50%',
                      background:'var(--green)', color:'#000',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem',
                    }}>{n.value}</div>
                  ))}
                </div>
                {drawHistory[0] && (
                  <div style={{ padding:'12px 16px', background:'var(--bg-raise)', borderRadius:'var(--radius)' }}>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:4 }}>Your result:</div>
                    <span className={`badge ${drawHistory[0].matchCount >= 5 ? 'badge-gold' : drawHistory[0].matchCount >= 3 ? 'badge-green' : 'badge-gray'}`}>
                      {drawHistory[0].matchCount} {drawHistory[0].matchCount === 1 ? 'match' : 'matches'}
                      {drawHistory[0].prizeAmount > 0 && ` — Won ₹${drawHistory[0].prizeAmount.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'28px 0' }}>
                <div style={{ fontSize:'3rem', marginBottom:12 }}>🎯</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:8 }}>Draw Coming Soon</div>
                <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:16 }}>
                  {hasActiveSub && scores.length >= 3
                    ? "You're eligible! Make sure your scores are up to date."
                    : 'Subscribe and enter 3+ scores to participate.'}
                </p>
                {hasActiveSub && scores.length < 3 && (
                  <Link to="/scores" className="btn btn-primary btn-sm">Add Scores Now</Link>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent winnings */}
        {winnings.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} className="card" style={{ marginTop:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:'1.1rem' }}>My Winnings</h3>
              <Link to="/winners" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Draw</th><th>Match Type</th><th>Prize</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {winnings.slice(0,5).map(w => (
                    <tr key={w._id}>
                      <td>{w.draw?.month}/{w.draw?.year}</td>
                      <td><span className="badge badge-gold">{w.matchType}</span></td>
                      <td style={{ fontWeight:600, color:'var(--green)' }}>₹{w.prizeAmount?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${w.paymentStatus==='paid'?'badge-green':w.verificationStatus==='rejected'?'badge-red':'badge-gray'}`}>
                          {w.verificationStatus === 'approved' ? w.paymentStatus : w.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Charity card */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }} className="card" style={{ marginTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>❤️</div>
            <div>
              <div style={{ fontWeight:600, marginBottom:4 }}>Your Charity</div>
              {user?.selectedCharity ? (
                <div style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>
                  Supporting <strong style={{ color:'var(--text)' }}>{user.selectedCharity?.name || 'Selected Charity'}</strong> at <strong style={{ color:'var(--green)' }}>{user.charityContributionPercent}%</strong>
                </div>
              ) : (
                <div style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>No charity selected yet</div>
              )}
            </div>
          </div>
          <Link to="/charities" className="btn btn-outline btn-sm">
            {user?.selectedCharity ? 'Change Charity' : 'Choose Charity'}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
