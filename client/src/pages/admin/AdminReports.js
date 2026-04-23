import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import API from '../../utils/api';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 14px', fontSize:'0.85rem' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('₹') ? `₹${p.value.toFixed(2)}` : p.value}</div>
      ))}
    </div>
  );
};

const AdminReports = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    API.get(`/admin/reports?period=${period}`)
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <AdminLayout title="Reports & Analytics"><div style={{ color:'var(--text-muted)', padding:48, textAlign:'center' }}>Loading reports…</div></AdminLayout>;

  // Prepare draw stats for chart
  const drawChartData = (data?.drawStats || []).map(d => ({
    name: `${new Date(0,d.month-1).toLocaleString('default',{month:'short'})} ${d.year}`,
    participants: d.totalParticipants,
    pool: d.prizePool?.total || 0,
    winners5: d.winners?.fiveMatch?.length || 0,
    winners4: d.winners?.fourMatch?.length || 0,
    winners3: d.winners?.threeMatch?.length || 0,
  })).reverse();

  // User growth data
  const userGrowthData = (data?.userGrowth || []).map(d => ({
    date: d._id,
    users: d.count,
  }));

  // Revenue data
  const revenueData = (data?.revenueData || []).map(d => ({
    month: d._id,
    revenue: d.total,
    subs: d.count,
  }));

  // Charity pie data
  const charityPieData = (data?.charityData || []).map(d => ({
    name: d.name || 'Unknown',
    value: d.count,
  }));

  return (
    <AdminLayout title="Reports & Analytics">
      {/* Period selector */}
      <div style={{ display:'flex', gap:8, marginBottom:32 }}>
        {[
          { label:'Last 7 days', val:'7' },
          { label:'Last 30 days', val:'30' },
          { label:'Last 90 days', val:'90' },
          { label:'Last 365 days', val:'365' },
        ].map(p => (
          <button key={p.val} onClick={() => setPeriod(p.val)} className={`btn btn-sm ${period===p.val?'btn-primary':'btn-outline'}`}>{p.label}</button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
        {/* User growth */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="card">
          <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>New User Registrations</h3>
          {userGrowthData.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>No registration data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" name="New Users" stroke="#22c55e" strokeWidth={2} fill="url(#userGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Revenue */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="card">
          <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>Monthly Revenue (₹ INR)</h3>
          {revenueData.length === 0 ? (
            <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>No revenue data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="₹ Revenue (INR)" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="grid-2">
          {/* Charity distribution */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="card">
            <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>Charity Support Distribution</h3>
            {charityPieData.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>No charity data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={charityPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                      {charityPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} subscribers`, n]} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {charityPieData.map((d, i) => (
                    <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.85rem' }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }} />
                        <span style={{ color:'var(--text-muted)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight:600 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Draw performance */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="card">
            <h3 style={{ fontSize:'1.05rem', marginBottom:20 }}>Draw Participation History</h3>
            {drawChartData.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>No completed draws yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={drawChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="participants" name="Participants" fill="#22c55e" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Draw winner summary table */}
            {drawChartData.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Draw</th><th>5-Match</th><th>4-Match</th><th>3-Match</th><th>Pool</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drawChartData.map(d => (
                        <tr key={d.name}>
                          <td style={{ fontWeight:500 }}>{d.name}</td>
                          <td><span className={`badge ${d.winners5>0?'badge-gold':'badge-gray'}`}>{d.winners5}</span></td>
                          <td><span className={`badge ${d.winners4>0?'badge-green':'badge-gray'}`}>{d.winners4}</span></td>
                          <td><span className={`badge ${d.winners3>0?'badge-blue':'badge-gray'}`}>{d.winners3}</span></td>
                          <td style={{ color:'var(--green)', fontWeight:600 }}>₹{d.pool.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
