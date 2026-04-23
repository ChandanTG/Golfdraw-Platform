import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const NAV = [
  { to:'/admin',           icon:'📊', label:'Dashboard' },
  { to:'/admin/users',     icon:'👥', label:'Users' },
  { to:'/admin/draws',     icon:'🎯', label:'Draws' },
  { to:'/admin/charities', icon:'❤️', label:'Charities' },
  { to:'/admin/winners',   icon:'🏆', label:'Winners' },
  { to:'/admin/reports',   icon:'📈', label:'Reports' },
];

const AdminLayout = ({ title, children }) => {
  const { pathname } = useLocation();
  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 72px)' }}>
      {/* Sidebar */}
      <aside style={{
        width:220, flexShrink:0,
        background:'var(--bg-card)', borderRight:'1px solid var(--border)',
        padding:'28px 12px', position:'sticky', top:72, height:'calc(100vh - 72px)', overflowY:'auto',
      }}>
        <div style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-dim)', padding:'0 12px', marginBottom:12 }}>Admin Panel</div>
        {NAV.map(n => {
          const active = n.to === '/admin' ? pathname === '/admin' : pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'10px 12px', borderRadius:'var(--radius-sm)', marginBottom:2,
              background: active ? 'var(--green-glow)' : 'transparent',
              color: active ? 'var(--green)' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400, fontSize:'0.92rem',
              border: `1px solid ${active ? 'rgba(34,197,94,0.25)' : 'transparent'}`,
              transition:'all 0.15s',
            }}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'36px 36px 80px', overflowX:'hidden' }}>
        {title && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:'1.8rem' }}>{title}</h1>
          </motion.div>
        )}
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
