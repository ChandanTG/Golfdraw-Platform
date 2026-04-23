import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';

/* ── Animated counter ─────────────────────────────── */
const Counter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ── Draw ball visual ─────────────────────────────── */
const DrawBall = ({ number, delay = 0 }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    style={{
      width: 64, height: 64, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--green) 0%, #16a34a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#000',
      boxShadow: '0 0 24px rgba(34,197,94,0.4)',
    }}
  >{number}</motion.div>
);

/* ── Feature card ─────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="card card-hover"
    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: 'var(--green-glow)',
      border: '1px solid rgba(34,197,94,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
    }}>{icon}</div>
    <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: 1.7 }}>{desc}</p>
  </motion.div>
);

/* ── Step ─────────────────────────────────────────── */
const Step = ({ num, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
      background: 'var(--green)', color: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem',
    }}>{num}</div>
    <div>
      <h4 style={{ marginBottom: 6 }}>{title}</h4>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: 1.7 }}>{desc}</p>
    </div>
  </motion.div>
);

/* ── Main Landing ─────────────────────────────────── */
const Landing = () => {
  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: 80,
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', top: '-10%', right: '-10%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', bottom: '0%', left: '-5%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="section-label">Monthly Draw Platform</div>
              <h1 style={{ marginBottom: 24, lineHeight: 1.08 }}>
                Golf scores.<br />
                Monthly draws.<br />
                <span style={{ color: 'var(--green)' }}>Real prizes.</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                Track your Stableford scores, enter monthly prize draws, and support the charity you love — all in one platform built for modern golfers.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Start Playing →
                </Link>
                <Link to="/charities" className="btn btn-outline btn-lg">
                  View Charities
                </Link>
              </div>

              <div style={{ display: 'flex', gap: 36, marginTop: 48 }}>
                {[
                  { val: 2400, suffix: '+', label: 'Members' },
                  { val: 1.5, suffix: 'Cr+', label: 'Prize Pool' },
                  { val: 12, suffix: '', label: 'Charities' },
                ].map(({ val, suffix, label }) => (
                  <div key={label} className="stat-block">
                    <span className="stat-value" style={{ color: 'var(--green)' }}>
                      <Counter target={val} suffix={suffix} />
                    </span>
                    <span className="stat-label">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Draw visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="float-anim"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 28, padding: 36, maxWidth: 380, width: '100%',
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>January Draw</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>Winning Numbers</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 28, justifyContent: 'center' }}>
                {[7, 14, 21, 28, 35].map((n, i) => <DrawBall key={n} number={n} delay={0.6 + i * 0.1} />)}
              </div>
              <div style={{ background: 'var(--bg-raise)', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>Prize Pool Breakdown</div>
                {[
                  { label: '5-Match Winner', pct: '40%', amount: '₹2,40,000', color: 'var(--gold)' },
                  { label: '4-Match Winners', pct: '35%', amount: '₹2,10,000', color: 'var(--green)' },
                  { label: '3-Match Winners', pct: '25%', amount: '₹1,50,000', color: 'var(--blue)' },
                ].map(({ label, pct, amount, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: 'var(--text-dim)' }}>{pct}</span>
                      <span style={{ fontWeight: 600, color }}>{amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <style>{`@media(max-width:768px){.hero-grid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 72 }}
          >
            <div className="section-label">Simple to play</div>
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Three simple steps between you and monthly prize draws.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              <Step num="1" title="Subscribe & Choose Your Charity" desc="Pick a monthly or yearly plan. Select a charity you care about — at least 10% of subscription fees go directly to them." delay={0.1} />
              <Step num="2" title="Enter Your 5 Stableford Scores" desc="Log your last 5 Stableford scores (1–45). New scores automatically replace the oldest. No fuss, no fiddling." delay={0.2} />
              <Step num="3" title="Wait for the Monthly Draw" desc="Each month our system draws 5 numbers. Match 3, 4, or all 5 to win a share of the prize pool. Jackpot rolls over if no 5-match winner!" delay={0.3} />
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {[
                { icon: '⛳', label: 'Your Scores', scores: [12, 21, 8, 35, 19], match: [false, true, false, true, false] },
              ].map(({ icon, label, scores, match }) => (
                <div key={label} className="card">
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{label}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {scores.map((s, i) => (
                      <div key={i} style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: match[i] ? 'var(--green-glow)' : 'var(--bg-raise)',
                        border: `2px solid ${match[i] ? 'var(--green)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
                        color: match[i] ? 'var(--green)' : 'var(--text)',
                      }}>{s}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-green">2 Matches</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Keep going — 3 to win!</span>
                  </div>
                </div>
              ))}

              <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)', borderColor: 'rgba(34,197,94,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '2rem' }}>🏆</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 2 }}>Jackpot This Month</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>₹6,00,000</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Rolled over from last month • No 5-match winner</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div className="section-label">Everything you need</div>
            <h2 className="section-title">Built for Real Golfers</h2>
          </motion.div>
          <div className="grid-3">
            <FeatureCard icon="📊" title="Stableford Tracking" desc="Log scores from 1–45 with date, course and notes. The platform automatically keeps only your 5 most recent." delay={0} />
            <FeatureCard icon="🎯" title="Monthly Prize Draws" desc="Random or frequency-based draw algorithms. 3-match, 4-match, and 5-match prize tiers with jackpot rollover." delay={0.1} />
            <FeatureCard icon="❤️" title="Charity First" desc="At least 10% of every subscription goes to the charity you choose. Increase your contribution anytime." delay={0.2} />
            <FeatureCard icon="🔒" title="Secure & Transparent" desc="JWT authentication, encrypted payments via Stripe, and full audit trails for every draw result." delay={0.3} />
            <FeatureCard icon="📱" title="Mobile Ready" desc="Fully responsive design. Log scores from the course, check results on the way home." delay={0.4} />
            <FeatureCard icon="⚡" title="Real-time Results" desc="Draw results published instantly. Email notifications for winners with easy proof upload." delay={0.5} />
          </div>
        </div>
      </section>

      {/* ── CHARITY STRIP ── */}
      <section style={{ padding: '80px 0', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
            <div className="section-label">Making an impact</div>
            <h2 style={{ marginBottom: 16 }}>Golf with a <span style={{ color: 'var(--green)' }}>Purpose</span></h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto 48px', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Every subscription powers two things: your chance to win, and real change for a cause that matters.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              {[
                { icon: '🏥', label: 'Health' },
                { icon: '📚', label: 'Education' },
                { icon: '🌳', label: 'Environment' },
                { icon: '⚽', label: 'Sports' },
                { icon: '🏘️', label: 'Community' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'var(--bg-raise)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                  }}>{icon}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 40 }}>
              <Link to="/charities" className="btn btn-outline">Browse All Charities →</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity:0, y:20 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            style={{ textAlign:'center', marginBottom:56 }}
          >
            <div className="section-label">Simple pricing</div>
            <h2>One price. Everything included.</h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, maxWidth:760, margin:'0 auto' }}>
            <PriceCard
              label="Monthly"
              price="₹850"
              period="/mo"
              features={['Score tracking', 'Monthly draw entry', 'Charity contributions', 'Prize notifications']}
              to="/register?plan=monthly"
            />
            <PriceCard
              label="Yearly"
              price="₹8500"
              period="/yr"
              save="Save ₹1700"
              highlight
              features={['Everything in Monthly', '2 months free', 'Priority winner support', 'Early access to features']}
              to="/register?plan=yearly"
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 style={{ marginBottom: 16 }}>Ready to play for real?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
              Join thousands of golfers already tracking scores, winning prizes, and giving back.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '18px 44px' }}>
              Create Your Account →
            </Link>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: 16 }}>No long-term commitment. Cancel anytime.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const PriceCard = ({ label, price, period, save, highlight, features, to }) => (
  <motion.div
    initial={{ opacity:0, y:20 }}
    whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true }}
    className="card"
    style={{
      border: highlight ? '1px solid var(--green)' : '1px solid var(--border)',
      background: highlight ? 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
      position: 'relative',
    }}
  >
    {save && (
      <div style={{
        position: 'absolute', top: -12, right: 20,
        background: 'var(--green)', color: '#000',
        padding: '4px 12px', borderRadius: 999,
        fontSize: '0.75rem', fontWeight: 700,
      }}>{save}</div>
    )}
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.8rem', color: highlight ? 'var(--green)' : 'var(--text)' }}>{price}</span>
        <span style={{ color: 'var(--text-muted)' }}>{period}</span>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
      {features.map(f => (
        <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
          <span style={{ color: 'var(--text-muted)' }}>{f}</span>
        </div>
      ))}
    </div>
    <Link to={to} className={`btn ${highlight ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>
      Get Started
    </Link>
  </motion.div>
);

export default Landing;
