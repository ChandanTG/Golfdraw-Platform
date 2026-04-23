import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = true, size = 40 }) => {
  const inner = (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: size, height: size,
          border: `3px solid var(--border)`,
          borderTop: `3px solid var(--green)`,
          borderRadius: '50%',
        }}
      />
      <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Loading…</span>
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <div style={{
      position:'fixed', inset:0, background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
    }}>
      {inner}
    </div>
  );
};

export default Loader;
