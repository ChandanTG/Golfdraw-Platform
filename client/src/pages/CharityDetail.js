import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const categoryIcon = c => ({ health:'🏥', education:'📚', environment:'🌳', sports:'⚽', community:'🏘️', children:'👶', animals:'🐾', other:'🤝' }[c] || '🤝');

const CharityDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [charity, setCharity]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [percent, setPercent]   = useState(user?.charityContributionPercent || 10);

  useEffect(() => {
    API.get(`/charities/${id}`)
      .then(r => { setCharity(r.data.data); setLoading(false); })
      .catch(() => { toast.error('Charity not found'); navigate('/charities'); });
  }, [id]);

  const isSelected = user?.selectedCharity?._id === charity?._id || user?.selectedCharity === charity?._id;

  const handleSelect = async () => {
    if (!isAuthenticated) { navigate('/register'); return; }
    setSelecting(true);
    try {
      await API.put('/charities/select', { charityId: charity._id, contributionPercent: percent });
      await refreshUser();
      toast.success(`Now supporting ${charity.name} at ${percent}%!`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to select charity'); }
    setSelecting(false);
  };

  if (loading) return (
    <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text-muted)' }}>Loading charity…</div>
    </div>
  );

  if (!charity) return null;

  return (
    <div style={{ padding:'60px 0 100px' }}>
      <div className="container">
        {/* Back */}
        <button onClick={() => navigate('/charities')} style={{ color:'var(--text-muted)', fontSize:'0.88rem', marginBottom:32, display:'flex', alignItems:'center', gap:6 }}>
          ← Back to Charities
        </button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:40, alignItems:'start' }}>
          {/* Main content */}
          <div>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
              {/* Header */}
              <div style={{ display:'flex', gap:20, alignItems:'flex-start', marginBottom:32 }}>
                <div style={{ width:72, height:72, borderRadius:18, background:'var(--bg-raise)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', flexShrink:0 }}>
                  {categoryIcon(charity.category)}
                </div>
                <div>
                  <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:6 }}>
                    <span className="badge badge-gray" style={{ textTransform:'capitalize' }}>{charity.category}</span>
                    {isSelected && <span className="badge badge-green">✓ Your Charity</span>}
                  </div>
                  <h1 style={{ fontSize:'clamp(1.8rem, 4vw, 2.8rem)', marginBottom:6 }}>{charity.name}</h1>
                  {charity.website && (
                    <a href={charity.website} target="_blank" rel="noreferrer" style={{ color:'var(--green)', fontSize:'0.88rem' }}>
                      🔗 {charity.website}
                    </a>
                  )}
                </div>
              </div>

              {/* Stats strip */}
              <div style={{ display:'flex', gap:0, marginBottom:36, background:'var(--bg-card)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', overflow:'hidden' }}>
                {[
                  { label:'Supporters', value:charity.subscriberCount || 0, icon:'👥' },
                  { label:'Total Raised', value:`₹${(charity.totalContributions||0).toLocaleString()}`, icon:'₹' },
                  { label:'Upcoming Events', value:charity.events?.filter(e=>new Date(e.date)>=new Date()).length || 0, icon:'📅' },
                ].map(({ label, value, icon }, i) => (
                  <div key={label} style={{ flex:1, padding:'20px 24px', borderRight: i<2 ? '1px solid var(--border)' : 'none', textAlign:'center' }}>
                    <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{icon}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.5rem', marginBottom:2 }}>{value}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ marginBottom:40 }}>
                <h2 style={{ fontSize:'1.3rem', marginBottom:16 }}>About This Charity</h2>
                <div style={{ color:'var(--text-muted)', lineHeight:1.8, fontSize:'0.97rem' }}>
                  {charity.description?.split('\n').map((p, i) => p ? <p key={i} style={{ marginBottom:14 }}>{p}</p> : null)}
                </div>
              </div>

              {/* Events */}
              {charity.events?.length > 0 && (
                <div>
                  <h2 style={{ fontSize:'1.3rem', marginBottom:20 }}>Upcoming Events</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {charity.events
                      .sort((a,b) => new Date(a.date)-new Date(b.date))
                      .map((ev, i) => {
                        const isPast = new Date(ev.date) < new Date();
                        return (
                          <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                            style={{ display:'flex', gap:16, padding:'16px 20px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', opacity:isPast?0.6:1 }}>
                            <div style={{ minWidth:52, textAlign:'center' }}>
                              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.4rem', color:isPast?'var(--text-dim)':'var(--green)', lineHeight:1 }}>
                                {new Date(ev.date).getDate()}
                              </div>
                              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase' }}>
                                {new Date(ev.date).toLocaleString('default',{month:'short'})}
                              </div>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:600, marginBottom:3 }}>{ev.title}</div>
                              {ev.location && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:4 }}>📍 {ev.location}</div>}
                              {ev.description && <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.6 }}>{ev.description}</div>}
                            </div>
                            {isPast && <span className="badge badge-gray" style={{ alignSelf:'flex-start', flexShrink:0 }}>Past</span>}
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar — Select card */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} style={{ position:'sticky', top:100 }}>
            <div className="card" style={{ border: isSelected ? '1px solid var(--green)' : '1px solid var(--border)', background: isSelected ? 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, var(--bg-card) 100%)' : 'var(--bg-card)' }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:'2.5rem', marginBottom:8 }}>❤️</div>
                <h3 style={{ fontSize:'1.1rem', marginBottom:6 }}>
                  {isSelected ? 'You Support This Charity' : 'Support This Charity'}
                </h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.6 }}>
                  {isSelected
                    ? `You're contributing ${user?.charityContributionPercent}% of your subscription.`
                    : 'Choose your contribution percentage and select this charity.'}
                </p>
              </div>

              {!isSelected && isAuthenticated && (
                <div style={{ marginBottom:20 }}>
                  <label className="form-label" style={{ display:'block', marginBottom:10 }}>Contribution % (min 10%)</label>
                  <input
                    type="range" min={10} max={100} step={5}
                    value={percent} onChange={e => setPercent(+e.target.value)}
                    style={{ width:'100%', accentColor:'var(--green)', marginBottom:8 }}
                  />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--text-muted)' }}>
                    <span>10%</span>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.1rem', color:'var(--green)' }}>{percent}%</span>
                    <span>100%</span>
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                    {[10,15,20,25,50].map(v => (
                      <button key={v} onClick={() => setPercent(v)} className={`btn btn-sm ${percent===v?'btn-primary':'btn-outline'}`}>{v}%</button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSelect}
                className={`btn ${isSelected ? 'btn-outline' : 'btn-primary'}`}
                style={{ width:'100%', justifyContent:'center', padding:14 }}
                disabled={selecting}
              >
                {selecting ? 'Saving…' : isSelected ? 'Change Charity' : isAuthenticated ? `Support at ${percent}%` : 'Sign Up to Support →'}
              </button>

              <div style={{ marginTop:16, padding:'12px 14px', background:'var(--bg-raise)', borderRadius:'var(--radius)', fontSize:'0.82rem', color:'var(--text-muted)', textAlign:'center', lineHeight:1.6 }}>
                At least 10% of your subscription goes directly to this charity every month.
              </div>
            </div>

            {/* Impact card */}
            <div className="card" style={{ marginTop:14, background:'var(--bg-raise)' }}>
              <div style={{ fontWeight:600, marginBottom:12, fontSize:'0.9rem' }}>💡 Your Impact</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'0.84rem', color:'var(--text-muted)' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Monthly (10%)</span>
                  <span style={{ color:'var(--green)', fontWeight:600 }}>₹85/mo</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Yearly (10%)</span>
                  <span style={{ color:'var(--green)', fontWeight:600 }}>₹850/yr</span>
                </div>
                <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />
                <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', lineHeight:1.6 }}>
                  Scale up your contribution in your Profile Settings anytime.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .charity-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default CharityDetail;
