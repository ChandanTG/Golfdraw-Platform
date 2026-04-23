import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const Subscribe = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [plan, setPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const hasActiveSub = user?.subscription?.status === 'active';

  const checkout = async () => {
    if (!isAuthenticated) { window.location.href = '/register'; return; }
    if (hasActiveSub) { toast('You already have an active subscription!'); return; }
    setLoading(true);
    try {
      // Use mock purchase if available in development, else fallback to Stripe
      const res = await API.post('/payments/mock-purchase', { plan });
      if (res.data.success) {
        toast.success('Subscription activated successfully!');
        await refreshUser();
        window.location.href = '/dashboard?subscription=success';
      } else {
        // Fallback for production or if mock is disabled
        const stripeRes = await API.post('/payments/create-checkout-session', { plan });
        window.location.href = stripeRes.data.url;
      }
    } catch (err) {
      // If mock-purchase fails (e.g., it's disabled), try Stripe
      try {
        const stripeRes = await API.post('/payments/create-checkout-session', { plan });
        window.location.href = stripeRes.data.url;
      } catch (stripeErr) {
        toast.error(stripeErr.response?.data?.error || 'Failed to start checkout');
      }
    }
    setLoading(false);
  };

  const features = [
    { icon:'⛳', text:'Unlimited Stableford score tracking' },
    { icon:'🎯', text:'Monthly draw entry (need 3+ scores)' },
    { icon:'🏆', text:'3-match, 4-match, 5-match prize tiers' },
    { icon:'🔄', text:'Jackpot rollover when no 5-match winner' },
    { icon:'❤️', text:'Minimum 10% goes to your chosen charity' },
    { icon:'📧', text:'Instant winner notifications via email' },
    { icon:'📊', text:'Score stats and draw history dashboard' },
    { icon:'🔒', text:'Secure Stripe billing — cancel anytime' },
  ];

  return (
    <div style={{ padding:'80px 0', minHeight:'100vh' }}>
      <div style={{ position:'fixed', top:'20%', left:'50%', transform:'translateX(-50%)', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:60 }}>
          <div className="section-label">Simple Pricing</div>
          <h1 style={{ marginBottom:16 }}>One Subscription, <span style={{ color:'var(--green)' }}>Everything</span></h1>
          <p style={{ color:'var(--text-muted)', maxWidth:480, margin:'0 auto', fontSize:'1.05rem', lineHeight:1.7 }}>
            Track scores, enter monthly draws, and support charities — all for one low monthly or annual fee.
          </p>
        </motion.div>

        {/* Plan toggle */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:48 }}>
          <div style={{ display:'flex', background:'var(--bg-raise)', borderRadius:999, padding:5, border:'1px solid var(--border)' }}>
            {[
              { id:'monthly', label:'Monthly', price:'₹850/mo' },
              { id:'yearly',  label:'Yearly',  price:'₹8500/yr', save:'Save ₹1700' },
            ].map(p => (
              <button key={p.id} onClick={() => setPlan(p.id)} style={{
                padding:'10px 28px', borderRadius:999,
                background: plan === p.id ? 'var(--green)' : 'transparent',
                color: plan === p.id ? '#000' : 'var(--text-muted)',
                fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.9rem',
                transition:'all 0.25s', position:'relative',
              }}>
                {p.label}
                {p.save && plan === p.id && (
                  <span style={{ position:'absolute', top:-8, right:-4, background:'var(--gold)', color:'#000', fontSize:'0.65rem', padding:'1px 7px', borderRadius:999, fontWeight:700 }}>{p.save}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, maxWidth:900, margin:'0 auto' }}>
          {/* Features list */}
          <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }} className="card">
            <h3 style={{ fontSize:'1.2rem', marginBottom:24 }}>What's included</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {features.map(({ icon, text }) => (
                <div key={text} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{icon}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.93rem', lineHeight:1.6 }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Price card */}
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}>
            <div className="card" style={{ border:'1px solid var(--green)', background:'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, var(--bg-card) 100%)', marginBottom:16 }}>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                  {plan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:8 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'3.5rem', color:'var(--green)' }}>
                    {plan === 'monthly' ? '₹850' : '₹8500'}
                  </span>
                  <span style={{ color:'var(--text-muted)' }}>{plan === 'monthly' ? '/month' : '/year'}</span>
                </div>
                {plan === 'yearly' && (
                  <div style={{ background:'var(--green-glow)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'var(--radius-sm)', padding:'8px 14px', fontSize:'0.85rem', color:'var(--green)' }}>
                    🎉 That's only ₹708/mo — 2 months free!
                  </div>
                )}
              </div>

              {hasActiveSub ? (
                <div style={{ padding:'14px 20px', background:'var(--green-glow)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:'var(--radius)', textAlign:'center' }}>
                  <div style={{ color:'var(--green)', fontWeight:600, marginBottom:4 }}>✓ You're subscribed!</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{user?.subscription?.plan} plan — {user?.subscription?.status}</div>
                  <a href="/profile" style={{ color:'var(--green)', fontSize:'0.85rem', marginTop:8, display:'block' }}>Manage subscription →</a>
                </div>
              ) : (
                <button
                  onClick={checkout}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width:'100%', justifyContent:'center', padding:'16px', fontSize:'1.05rem' }}
                >
                  {loading ? 'Redirecting…' : isAuthenticated ? `Subscribe ${plan === 'monthly' ? 'Monthly' : 'Yearly'} →` : 'Get Started →'}
                </button>
              )}

              <p style={{ textAlign:'center', color:'var(--text-dim)', fontSize:'0.78rem', marginTop:14 }}>
                Powered by Stripe. Cancel anytime. No hidden fees.
              </p>
            </div>

            {/* Guarantee */}
            <div className="card" style={{ background:'var(--bg-raise)', textAlign:'center' }}>
              <div style={{ fontSize:'1.8rem', marginBottom:10 }}>🛡️</div>
              <div style={{ fontWeight:600, marginBottom:6 }}>Cancel Anytime</div>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', lineHeight:1.6 }}>
                No long-term contracts. Cancel from your dashboard and your access continues until the end of the billing period.
              </p>
            </div>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} style={{ maxWidth:640, margin:'64px auto 0' }}>
          <h2 style={{ textAlign:'center', fontSize:'1.6rem', marginBottom:36 }}>Common Questions</h2>
          {[
            { q:'How does the draw work?', a:'Each month, 5 numbers are drawn between 1–45. Your last 5 Stableford scores are compared against the drawn numbers. Match 3, 4, or all 5 to win.' },
            { q:'What happens if no one gets a 5-match?', a:'The 5-match prize (40% of pool) rolls over to next month\'s jackpot. It keeps growing until someone wins.' },
            { q:'How is the charity contribution calculated?', a:'A minimum of 10% of your subscription is allocated to your chosen charity. You can increase this percentage in your profile settings.' },
            { q:'When are draws held?', a:'Draws are held monthly, typically at the end of each calendar month. Results are published on the platform and winners are notified by email.' },
          ].map(({ q, a }, i) => (
            <div key={i} style={{ borderBottom:'1px solid var(--border)', padding:'20px 0' }}>
              <div style={{ fontWeight:600, marginBottom:8 }}>{q}</div>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:1.7 }}>{a}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Subscribe;
