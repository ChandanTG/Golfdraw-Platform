import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['health','education','environment','sports','community','children','animals','other'];

const emptyForm = {
  name:'', shortDescription:'', description:'', category:'health',
  website:'', featuredOrder:0, isActive:true
};

const AdminCharities = () => {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [showEventModal, setShowEventModal] = useState(null); // charityId
  const [eventForm, setEventForm] = useState({ title:'', description:'', date:'', location:'' });

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const res = await API.get('/charities?includeInactive=true');
      setCharities(res.data.data);
    } catch { toast.error('Failed to load charities'); }
    setLoading(false);
  };

  useEffect(() => { fetchCharities(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (c)  => { setEditItem(c); setForm({ name:c.name, shortDescription:c.shortDescription||'', description:c.description, category:c.category, website:c.website||'', featuredOrder:c.featuredOrder||0, isActive:c.isActive }); setShowModal(true); };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await API.put(`/charities/${editItem._id}`, form);
        toast.success('Charity updated');
      } else {
        await API.post('/charities', form);
        toast.success('Charity created');
      }
      setShowModal(false);
      fetchCharities();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    setSaving(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deactivate this charity? Users who selected it will not be affected.')) return;
    try {
      await API.delete(`/charities/${id}`);
      toast.success('Charity deactivated');
      fetchCharities();
    } catch { toast.error('Delete failed'); }
  };

  const handleAddEvent = async e => {
    e.preventDefault();
    try {
      await API.post(`/charities/${showEventModal}/events`, eventForm);
      toast.success('Event added');
      setShowEventModal(null);
      setEventForm({ title:'', description:'', date:'', location:'' });
      fetchCharities();
    } catch { toast.error('Failed to add event'); }
  };

  const categoryIcon = c => ({ health:'🏥', education:'📚', environment:'🌳', sports:'⚽', community:'🏘️', children:'👶', animals:'🐾', other:'🤝' }[c] || '🤝');

  return (
    <AdminLayout title="Charity Management">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:24 }}>
        <button onClick={openCreate} className="btn btn-primary">+ Add Charity</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>Loading…</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {charities.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity:0, y:12 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{ opacity: c.isActive ? 1 : 0.55 }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
                <div style={{ display:'flex', gap:14, alignItems:'flex-start', flex:1 }}>
                  {/* Icon */}
                  <div style={{ width:48, height:48, borderRadius:12, background:'var(--bg-raise)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>
                    {categoryIcon(c.category)}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:'1.02rem' }}>{c.name}</span>
                      <span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                      <span className="badge badge-gray">{c.category}</span>
                      {c.featuredOrder > 0 && <span className="badge badge-gold">Featured #{c.featuredOrder}</span>}
                    </div>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.6, maxWidth:520 }}>
                      {c.shortDescription || c.description?.slice(0,120)+'…'}
                    </p>
                    <div style={{ display:'flex', gap:20, marginTop:8, fontSize:'0.8rem', color:'var(--text-dim)' }}>
                      <span>👥 {c.subscriberCount} subscribers</span>
                      <span>₹ ₹{(c.totalContributions||0).toLocaleString()} raised</span>
                      <span>📅 {c.events?.length || 0} events</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-start' }}>
                  <button onClick={() => setShowEventModal(c._id)} className="btn btn-outline btn-sm">+ Event</button>
                  <button onClick={() => openEdit(c)} className="btn btn-outline btn-sm">Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="btn btn-sm" style={{ background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.2)' }}>
                    {c.isActive ? 'Deactivate' : 'Deleted'}
                  </button>
                </div>
              </div>

              {/* Events mini list */}
              {c.events?.length > 0 && (
                <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Upcoming Events</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {c.events.slice(0,3).map((ev, j) => (
                      <div key={j} style={{ padding:'6px 12px', background:'var(--bg-raise)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', fontSize:'0.82rem' }}>
                        <strong>{ev.title}</strong>
                        <span style={{ color:'var(--text-muted)', marginLeft:8 }}>
                          {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : ''}
                        </span>
                      </div>
                    ))}
                    {c.events.length > 3 && <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', alignSelf:'center' }}>+{c.events.length-3} more</span>}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }} className="modal" style={{ maxWidth:600 }}>
              <div className="modal-header">
                <span className="modal-title">{editItem ? 'Edit Charity' : 'Add Charity'}</span>
                <button onClick={() => setShowModal(false)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
              </div>
              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Charity Name *</label>
                  <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="Hearts in Motion" />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Featured Order (0 = not featured)</label>
                    <input className="form-input" type="number" min={0} value={form.featuredOrder} onChange={e=>setForm(f=>({...f,featuredOrder:+e.target.value}))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description (shown on cards)</label>
                  <input className="form-input" value={form.shortDescription} onChange={e=>setForm(f=>({...f,shortDescription:e.target.value}))} placeholder="One line summary (max 300 chars)" maxLength={300} />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Description *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={form.description}
                    onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    required
                    placeholder="Full charity description…"
                    style={{ resize:'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Website URL</label>
                  <input className="form-input" type="url" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://charity.org" />
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} style={{ accentColor:'var(--green)', width:16, height:16 }} />
                  <label htmlFor="isActive" style={{ fontSize:'0.9rem', cursor:'pointer' }}>Active (visible to users)</label>
                </div>

                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button type="button" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }} disabled={saving}>
                    {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Create Charity'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setShowEventModal(null); }}>
            <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }} className="modal">
              <div className="modal-header">
                <span className="modal-title">Add Charity Event</span>
                <button onClick={() => setShowEventModal(null)} style={{ color:'var(--text-muted)', fontSize:'1.3rem' }}>✕</button>
              </div>
              <form onSubmit={handleAddEvent} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input className="form-input" value={eventForm.title} onChange={e=>setEventForm(f=>({...f,title:e.target.value}))} required placeholder="Annual Golf Day" />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" value={eventForm.date} onChange={e=>setEventForm(f=>({...f,date:e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={eventForm.location} onChange={e=>setEventForm(f=>({...f,location:e.target.value}))} placeholder="St Andrews, Scotland" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={eventForm.description} onChange={e=>setEventForm(f=>({...f,description:e.target.value}))} style={{ resize:'vertical' }} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="btn btn-outline" style={{ flex:1, justifyContent:'center' }} onClick={() => setShowEventModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex:2, justifyContent:'center' }}>Add Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminCharities;
