import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{ background:'var(--bg-card)', borderTop:'1px solid var(--border)', padding:'56px 0 32px' }}>
    <div className="container">
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{
              width:36, height:36, borderRadius:9, background:'var(--green)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:800, color:'#000'
            }}>G</div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem' }}>
              Golf<span style={{ color:'var(--green)' }}>Draw</span>
            </span>
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:1.7, maxWidth:280 }}>
            A modern platform combining competitive golf score tracking with monthly prize draws and charitable giving.
          </p>
          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            {['🐦','💼','📷'].map((icon, i) => (
              <a key={i} href="#" style={{
                width:36, height:36, borderRadius:8, background:'var(--bg-raise)',
                border:'1px solid var(--border)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'1rem', transition:'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hi)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >{icon}</a>
            ))}
          </div>
        </div>

        <FooterCol title="Platform">
          <FooterLink to="/charities">Charities</FooterLink>
          <FooterLink to="/subscribe">Pricing</FooterLink>
          <FooterLink to="/register">Sign Up</FooterLink>
          <FooterLink to="/login">Sign In</FooterLink>
        </FooterCol>

        <FooterCol title="Members">
          <FooterLink to="/dashboard">Dashboard</FooterLink>
          <FooterLink to="/scores">My Scores</FooterLink>
          <FooterLink to="/draw">Monthly Draw</FooterLink>
          <FooterLink to="/winners">Winners</FooterLink>
        </FooterCol>

        <FooterCol title="Legal">
          <FooterLink to="#">Terms of Service</FooterLink>
          <FooterLink to="#">Privacy Policy</FooterLink>
          <FooterLink to="#">Cookie Policy</FooterLink>
          <FooterLink to="#">Contact Us</FooterLink>
        </FooterCol>
      </div>

      <div style={{ borderTop:'1px solid var(--border)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <p style={{ color:'var(--text-dim)', fontSize:'0.82rem' }}>
          © {new Date().getFullYear()} GolfDraw Platform. All rights reserved.
        </p>
        <p style={{ color:'var(--text-dim)', fontSize:'0.82rem' }}>
          Built with ❤️ for golfers who give back
        </p>
      </div>
    </div>

    <style>{`
      @media (max-width: 768px) {
        footer .container > div:first-child { grid-template-columns: 1fr 1fr !important; }
        footer .container > div:first-child > div:first-child { grid-column: 1/-1; }
      }
      @media (max-width: 480px) {
        footer .container > div:first-child { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </footer>
);

const FooterCol = ({ title, children }) => (
  <div>
    <h4 style={{ fontFamily:'var(--font-display)', fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:16 }}>{title}</h4>
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
  </div>
);

const FooterLink = ({ to, children }) => (
  <Link to={to} style={{ color:'var(--text-dim)', fontSize:'0.9rem', transition:'color 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
    onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}
  >{children}</Link>
);

export default Footer;
