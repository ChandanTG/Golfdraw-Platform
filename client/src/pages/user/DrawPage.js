import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const Ball = ({ number, matched, delay = 0 }) => (
  <motion.div
    initial={{ scale:0, opacity:0 }}
    animate={{ scale:1, opacity:1 }}
    transition={{ delay, type:'spring', stiffness:200 }}
    style={{
      width:60, height:60, borderRadius:'50%',
      background: matched ? 'var(--green)' : 'var(--bg-raise)',
      border: `2px solid ${matched ? 'var(--green)' : 'var(--border)'}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem',
      color: matched ? '#000' : 'var(--text)',
      boxShadow: matched ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
    }}
  >{number}</motion.div>
);

const DrawPage = () => {
  const { user } = useAuth();
  const [currentDraw, setCurrentDraw] = useState(null);
  const [history, setHistory] = useState([]);
  const [scores, setScores] = useState([]);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [drawRes, histRes, scoreRes] = await Promise.all([
          API.get('/draws/current'),
          API.get('/draws/my-history'),
          API.get('/scores'),
        ]);
        setCurrentDraw(drawRes.data.data);
        setParticipants(drawRes.data.eligibleParticipants || 0);
        setHistory(histRes.data.data);
        setScores(scoreRes.data.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month:'long' });
  const hasActiveSub = user?.subscription?.status === 'active';
  const isEligible = hasActiveSub && scores.length >= 3;

  const winningValues = currentDraw?.winningNumbers?.map(n => n.value) || [];
  const myScoreValues = scores.map(s => s.score);
  const myMatches = myScoreValues.filter(v => winningValues.includes(v));

  return (
    <div style={{ padding:'40px 0 80px' }}>
      <div className="container">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:40 }}>
          <div className="section-label">Monthly Competition</div>
          <h1 style={{ fontSize:'2.2rem', marginBottom:8 }}>{monthName} Draw</h1>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <span className={`badge ${isEligible ? 'badge-green' : 'badge-red'}`}>
              {isEligible ? '● You are eligible' : '○ Not eligible'}
            </span>
            <span style={{ color:'var(--text-muted)', fontSize:'0.88rem' }}>{participants} participants this month</span>
          </div>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
          {/* Current draw */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} className="card">
            {currentDraw?.status === 'published' ? (
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Winning Numbers</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.3rem' }}>{monthName} {currentDraw.year}</div>
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
                  {currentDraw.winningNumbers?.map((n, i) => (
                    <Ball key={n.position} number={n.value} matched={myScoreValues.includes(n.value)} delay={0.4 + i*0.08} />
                  ))}
                </div>
                {hasActiveSub && (
                  <div style={{ padding:'14px 16px', background:'var(--bg-raise)', borderRadius:'var(--radius)' }}>
                    <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:8 }}>Your result:</div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className={`badge ${myMatches.length>=5?'badge-gold':myMatches.length>=3?'badge-green':'badge-gray'}`} style={{ fontSize:'0.88rem', padding:'6px 14px' }}>
                        {myMatches.length === 0 ? 'No matches' : `${myMatches.length} match${myMatches.length!==1?'es':''}`}
                      </span>
                      {myMatches.length >= 3 && <span style={{ color:'var(--green)', fontSize:'0.88rem' }}>🎉 Winner!</span>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <motion.div animate={{ rotate:[0,5,-5,0] }} transition={{ repeat:Infinity, duration:3 }} style={{ fontSize:'3.5rem', marginBottom:16 }}>🎯</motion.div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.3rem', marginBottom:8 }}>Draw Not Yet Drawn</div>
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:1.6 }}>
                  The {monthName} draw will be executed and published by admins at the end of the month.
                </p>
                {!isEligible && hasActiveSub && (
                  <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'var(--radius)', fontSize:'0.85rem', color:'var(--gold)' }}>
                    ⚠️ You need at least 3 scores to participate
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Prize pool */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }} className="card">
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Prize Pool</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.2rem', color:'var(--green)' }}>
                ₹{currentDraw?.prizePool?.total?.toFixed(0) || (participants * 7).toFixed(0)}
              </div>
              {currentDraw?.jackpotCarriedIn > 0 && (
                <div style={{ color:'var(--gold)', fontSize:'0.82rem', marginTop:4 }}>+ ₹{currentDraw.jackpotCarriedIn} rolled over from last month</div>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'5-Match (Jackpot)', pct:'40%', color:'var(--gold)', icon:'🏆' },
                { label:'4-Match', pct:'35%', color:'var(--green)', icon:'🥈' },
                { label:'3-Match', pct:'25%', color:'var(--blue)', icon:'🥉' },
              ].map(({ label, pct, color, icon }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-raise)', borderRadius:'var(--radius)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span>{icon}</span>
                    <span style={{ fontSize:'0.9rem' }}>{label}</span>
                  </div>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:700, color }}>{pct}</span>
                </div>
              ))}
            </div>
            {currentDraw?.prizePool?.jackpotRollover > 0 && (
              <div style={{ marginTop:14, padding:'12px 14px', background:'var(--gold-glow)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--radius)', fontSize:'0.85rem', color:'var(--gold)' }}>
                🔄 ₹{currentDraw.prizePool.jackpotRollover.toFixed(2)} jackpot rolls over — no 5-match winner!
              </div>
            )}
          </motion.div>
        </div>

        {/* My scores for this draw */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="card" style={{ marginBottom:24 }}>
          <h3 style={{ fontSize:'1.1rem', marginBottom:16 }}>Your Entered Scores</h3>
          {scores.length === 0 ? (
            <p style={{ color:'var(--text-muted)' }}>No scores entered. <a href="/scores" style={{ color:'var(--green)' }}>Add scores now →</a></p>
          ) : (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {scores.map((s, i) => (
                <motion.div key={s._id} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5+i*0.06 }} style={{
                  width:58, height:58, borderRadius:'50%', flexShrink:0,
                  background: winningValues.includes(s.score) ? 'var(--green-glow)' : 'var(--bg-raise)',
                  border: `2px solid ${winningValues.includes(s.score) ? 'var(--green)' : 'var(--border)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem',
                  color: winningValues.includes(s.score) ? 'var(--green)' : 'var(--text)',
                  position:'relative',
                }}>
                  {s.score}
                  {winningValues.includes(s.score) && (
                    <span style={{ position:'absolute', top:-6, right:-6, background:'var(--green)', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem' }}>✓</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Draw history */}
        {history.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} className="card">
            <h3 style={{ fontSize:'1.1rem', marginBottom:20 }}>Draw History</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Draw</th><th>Winning Numbers</th><th>Your Scores</th><th>Matches</th><th>Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.drawId}>
                      <td style={{ fontWeight:600 }}>{new Date(h.drawDate).toLocaleString('default', { month:'long', year:'numeric' })}</td>
                      <td>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {h.winningNumbers?.map(n => (
                            <div key={n.position} style={{ width:28, height:28, borderRadius:'50%', background:'var(--green)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700 }}>{n.value}</div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {h.myScores?.map((s, i) => (
                            <span key={i} style={{ width:26, height:26, borderRadius:'50%', background:'var(--bg-raise)', border:'1px solid var(--border)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>{s}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${h.matchCount>=5?'badge-gold':h.matchCount>=3?'badge-green':'badge-gray'}`}>
                          {h.matchCount}
                        </span>
                      </td>
                      <td style={{ fontWeight:600, color: h.prizeAmount > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                        {h.prizeAmount > 0 ? `₹${h.prizeAmount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DrawPage;
