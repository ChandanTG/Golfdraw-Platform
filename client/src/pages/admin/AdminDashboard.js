import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';

const StatTile = ({ label, value, sub, color='var(--green)', icon, delay, to }) => (
  <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay }} className="card card-hover">
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
      <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
      <span style={{ fontSize:'1.3rem' }}>{icon}</span>
    </div>
    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', color, marginBottom:4 }}>{value}</div>
    {sub && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{sub}</div>}
    {to && <Link to={to} style={{ fontSize:'0.8rem', color:'var(--green)', marginTop:12, display:'block' }}>View all →</Link>}
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(r => { setStats(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Dashboard"><div style={{ color:'var(--text-muted)' }}>Loading…</div></AdminLayout>;

  const subMap = {};
  (stats?.subscriptionBreakdown || []).forEach(s => { subMap[s._id] = s.count; });

  return (
    <AdminLayout title="Dashboard">
      {/* Stats grid */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        <StatTile label="Total Users" value={stats?.totalUsers || 0} sub={`+${stats?.newUsersWeek || 0} this week`} icon="👥" delay={0} to="/admin/users" />
        <StatTile label="Active Subscribers" value={stats?.activeSubscribers || 0} sub="paying members" icon="💳" delay={0.05} color="var(--blue)" />
        <StatTile label="Prize Pool" value={`₹${(stats?.prizePool || 0).toFixed(0)}`} sub="this period" icon="💰" delay={0.1} color="var(--gold)" />
        <StatTile label="Charity Contributed" value={`₹${(stats?.charityContributions || 0).toFixed(0)}`} sub="min 10%" icon="❤️" delay={0.15} color="var(--red)" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Subscription breakdown */}
        <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} className="card">
          <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>Subscription Status</h3>
          {['active','cancelled','expired','none','past_due'].map(status => {
            const count = subMap[status] || 0;
            const total = stats?.totalUsers || 1;
            const pct = Math.round((count/total)*100);
            const color = status==='active'?'var(--green)':status==='past_due'?'var(--gold)':'var(--text-dim)';
            return (
              <div key={status} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.85rem' }}>
                  <span style={{ textTransform:'capitalize', color:'var(--text-muted)' }}>{status}</span>
                  <span style={{ fontWeight:600, color }}>{count}</span>
                </div>
                <div style={{ height:5, background:'var(--border)', borderRadius:3 }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.4, duration:0.8 }} style={{ height:'100%', background:color, borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }} className="card">
          <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>Quick Actions</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Link to="/admin/draws" className="btn btn-outline" style={{ justifyContent:'flex-start', gap:12 }}>
              <span>🎯</span> Manage Draws
            </Link>
            <Link to="/admin/winners" className="btn btn-outline" style={{ justifyContent:'flex-start', gap:12 }}>
              <span>🏆</span>
              Verify Winners
              {stats?.pendingWinners > 0 && (
                <span style={{ marginLeft:'auto', background:'var(--red)', color:'#fff', borderRadius:999, padding:'2px 8px', fontSize:'0.75rem', fontWeight:700 }}>
                  {stats.pendingWinners}
                </span>
              )}
            </Link>
            <Link to="/admin/users" className="btn btn-outline" style={{ justifyContent:'flex-start', gap:12 }}>
              <span>👥</span> Manage Users
            </Link>
            <Link to="/admin/charities" className="btn btn-outline" style={{ justifyContent:'flex-start', gap:12 }}>
              <span>❤️</span> Manage Charities
            </Link>
            <Link to="/admin/reports" className="btn btn-outline" style={{ justifyContent:'flex-start', gap:12 }}>
              <span>📈</span> View Reports
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Active draw status */}
      {stats?.activeDraw ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} className="card" style={{ background:'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, var(--bg-card) 100%)', border:'1px solid rgba(34,197,94,0.25)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Active Draw</div>
              <h3 style={{ fontSize:'1.1rem', marginBottom:4 }}>
                {new Date(0, stats.activeDraw.month-1).toLocaleString('default', {month:'long'})} {stats.activeDraw.year} Draw
              </h3>
              <span className={`badge ${stats.activeDraw.status==='executed'?'badge-gold':'badge-gray'}`}>
                {stats.activeDraw.status}
              </span>
            </div>
            <Link to="/admin/draws" className="btn btn-primary btn-sm">Manage Draw →</Link>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} className="card" style={{ textAlign:'center', padding:'32px' }}>
          <p style={{ color:'var(--text-muted)', marginBottom:14 }}>No active draw scheduled for this month.</p>
          <Link to="/admin/draws" className="btn btn-primary btn-sm">Schedule a Draw →</Link>
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
