import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['all','health','education','environment','sports','community','children','animals','other'];

const CharityCard = ({ charity, onSelect, isSelected, delay }) => (
  <motion.div
    initial={{ opacity:0, y:24 }}
    whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true }}
    transition={{ delay }}
    className="card card-hover"
    style={{ border: isSelected ? '1px solid var(--green)' : '1px solid var(--border)', position:'relative' }}
  >
    {isSelected && (
      <div style={{ position:'absolute', top:16, right:16, background:'var(--green)', color:'#000', borderRadius:999, padding:'3px 10px', fontSize:'0.75rem', fontWeight:700 }}>Your Charity ✓</div>
    )}
    <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:52, height:52, borderRadius:12, background:'var(--bg-raise)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
        {charity.category === 'health' ? '🏥' : charity.category === 'education' ? '📚' : charity.category === 'environment' ? '🌳' : charity.category === 'sports' ? '⚽' : charity.category === 'children' ? '👶' : '🤝'}
      </div>
      <div style={{ flex:1 }}>
        <h3 style={{ fontSize:'1.05rem', marginBottom:4 }}>{charity.name}</h3>
        <span className="badge badge-gray" style={{ fontSize:'0.72rem' }}>{charity.category}</span>
      </div>
    </div>
    <p style={{ color:'var(--text-muted)', fontSize:'0.88rem', lineHeight:1.7, marginBottom:20 }}>{charity.shortDescription || charity.description?.slice(0,140)+'…'}</p>
    <div style={{ display:'flex', gap:16, marginBottom:20, fontSize:'0.82rem', color:'var(--text-muted)' }}>
      <span>👥 {charity.subscriberCount} supporters</span>
      <span>₹ ₹{(charity.totalContributions || 0).toLocaleString()} raised</span>
    </div>
    <div style={{ display:'flex', gap:10 }}>
      <Link to={`/charities/${charity._id}`} className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center' }}>View</Link>
      {onSelect && !isSelected && (
        <button onClick={() => onSelect(charity._id)} className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:'center' }}>Support</button>
      )}
    </div>
  </motion.div>
);

const CharitiesPage = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('all');

  useEffect(() => {
    API.get('/charities').then(r => { setCharities(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = category === 'all' ? charities : charities.filter(c => c.category === category);

  const handleSelect = async (charityId) => {
    if (!isAuthenticated) { toast.error('Please sign in to select a charity'); return; }
    try {
      await API.put('/charities/select', { charityId });
      await refreshUser();
      toast.success('Charity updated!');
    } catch { toast.error('Failed to update charity'); }
  };

  return (
    <div style={{ padding:'60px 0 80px' }}>
      <div className="container">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:56 }}>
          <div className="section-label">Make an Impact</div>
          <h1 style={{ marginBottom:16 }}>Choose Your <span style={{ color:'var(--green)' }}>Charity</span></h1>
          <p style={{ color:'var(--text-muted)', fontSize:'1.05rem', maxWidth:540, margin:'0 auto', lineHeight:1.7 }}>
            At least 10% of your subscription goes directly to the charity you choose. Select one that resonates with you.
          </p>
        </motion.div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`btn btn-sm ${category===cat?'btn-primary':'btn-outline'}`}
              style={{ textTransform:'capitalize' }}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading charities…</div>
        ) : (
          <div className="grid-3">
            {filtered.map((c, i) => (
              <CharityCard
                key={c._id} charity={c}
                isSelected={user?.selectedCharity?._id === c._id || user?.selectedCharity === c._id}
                onSelect={isAuthenticated ? handleSelect : null}
                delay={i * 0.06}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>No charities in this category.</div>
        )}
      </div>
    </div>
  );
};

export default CharitiesPage;
