import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';
  const hasActiveSub = user?.subscription?.status === 'active';

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:72 }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:38, height:38, borderRadius:10, background:'var(--green)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem', color:'#000'
          }}>G</div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.15rem', letterSpacing:'-0.02em' }}>
            Golf<span style={{ color:'var(--green)' }}>Draw</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }} className="desktop-nav">
          <NavLink to="/charities">Charities</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/scores">My Scores</NavLink>
              <NavLink to="/draw">Draw</NavLink>
              {isAdmin && <NavLink to="/admin" highlight>Admin</NavLink>}
            </>
          )}
          {!isAuthenticated && <NavLink to="/subscribe">Pricing</NavLink>}
        </div>

        {/* Auth actions */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          ) : (
            <div style={{ position:'relative' }}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  background:'var(--bg-card)', border:'1px solid var(--border)',
                  borderRadius:999, padding:'6px 14px 6px 6px',
                  transition:'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  background:'var(--green)', color:'#000',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, fontSize:'0.85rem',
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize:'0.88rem', fontWeight:500 }}>{user?.name?.split(' ')[0]}</span>
                {hasActiveSub && (
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity:0, y:8, scale:0.96 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:8, scale:0.96 }}
                    transition={{ duration:0.15 }}
                    style={{
                      position:'absolute', top:'calc(100% + 8px)', right:0,
                      background:'var(--bg-card)', border:'1px solid var(--border)',
                      borderRadius:'var(--radius-lg)', minWidth:220,
                      boxShadow:'var(--shadow-lg)', overflow:'hidden', zIndex:999,
                    }}
                  >
                    <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ fontWeight:600 }}>{user?.name}</div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:2 }}>{user?.email}</div>
                      <div style={{ marginTop:8 }}>
                        <span className={`badge ${hasActiveSub ? 'badge-green' : 'badge-gray'}`}>
                          {hasActiveSub ? '● Active' : 'No Subscription'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding:8 }}>
                      <DropLink to="/dashboard">Dashboard</DropLink>
                      <DropLink to="/profile">Profile Settings</DropLink>
                      <DropLink to="/winners">My Winnings</DropLink>
                      {!hasActiveSub && <DropLink to="/subscribe">Subscribe</DropLink>}
                      {isAdmin && <DropLink to="/admin">Admin Panel</DropLink>}
                      <div style={{ height:1, background:'var(--border)', margin:'8px 0' }} />
                      <button
                        onClick={handleLogout}
                        style={{
                          width:'100%', textAlign:'left', padding:'10px 12px',
                          borderRadius:'var(--radius-sm)', color:'var(--red)',
                          fontSize:'0.9rem', transition:'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >Sign Out</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="hamburger"
            style={{
              display:'none', flexDirection:'column', gap:5, padding:8,
              background:'var(--bg-raise)', borderRadius:'var(--radius-sm)',
            }}
          >
            <span style={{ width:20, height:2, background:'var(--text)', borderRadius:2, transition:'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ width:20, height:2, background:'var(--text)', borderRadius:2, transition:'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width:20, height:2, background:'var(--text)', borderRadius:2, transition:'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            style={{ overflow:'hidden', background:'var(--bg-card)', borderBottom:'1px solid var(--border)' }}
          >
            <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:4 }}>
              <MobileLink to="/charities">Charities</MobileLink>
              {isAuthenticated ? (
                <>
                  <MobileLink to="/dashboard">Dashboard</MobileLink>
                  <MobileLink to="/scores">My Scores</MobileLink>
                  <MobileLink to="/draw">Draw</MobileLink>
                  <MobileLink to="/profile">Profile</MobileLink>
                  {isAdmin && <MobileLink to="/admin">Admin</MobileLink>}
                  <button onClick={handleLogout} style={{ textAlign:'left', padding:'12px 16px', color:'var(--red)', borderRadius:'var(--radius-sm)', fontSize:'0.95rem' }}>Sign Out</button>
                </>
              ) : (
                <>
                  <MobileLink to="/subscribe">Pricing</MobileLink>
                  <MobileLink to="/login">Sign In</MobileLink>
                  <MobileLink to="/register">Get Started →</MobileLink>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger   { display: flex !important; }
        }
      `}</style>
    </motion.nav>
  );
};

const NavLink = ({ to, children, highlight }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} style={{
      padding:'8px 14px', borderRadius:'var(--radius-sm)',
      fontSize:'0.9rem', fontWeight: active ? 600 : 400,
      color: active ? (highlight ? 'var(--gold)' : 'var(--green)') : 'var(--text-muted)',
      background: active ? (highlight ? 'var(--gold-glow)' : 'var(--green-glow)') : 'transparent',
      transition:'all 0.2s',
    }}>{children}</Link>
  );
};

const DropLink = ({ to, children }) => (
  <Link to={to} style={{
    display:'block', padding:'10px 12px', borderRadius:'var(--radius-sm)',
    fontSize:'0.9rem', color:'var(--text)', transition:'background 0.15s',
  }}
  onMouseEnter={e => e.currentTarget.style.background='var(--bg-raise)'}
  onMouseLeave={e => e.currentTarget.style.background='transparent'}
  >{children}</Link>
);

const MobileLink = ({ to, children }) => (
  <Link to={to} style={{
    padding:'12px 16px', borderRadius:'var(--radius-sm)',
    fontSize:'0.95rem', color:'var(--text)',
    display:'block', transition:'background 0.15s',
  }}
  onMouseEnter={e => e.currentTarget.style.background='var(--bg-raise)'}
  onMouseLeave={e => e.currentTarget.style.background='transparent'}
  >{children}</Link>
);

export default Navbar;
