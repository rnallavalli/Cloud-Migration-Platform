import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Shield, GitBranch, DollarSign, Layers, CheckSquare, BarChart2, Clock, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const WAVE_COLORS = ['#60a5fa','#34d399','#fbbf24','#f87171','#c084fc'];
const RISK_BADGE  = { low:'badge-green', medium:'badge-amber', high:'badge-red' };
const STRAT_COLOR = { 'lift-shift':'#60a5fa', replatform:'#fbbf24', refactor:'#c084fc' };
const TABS = [
  { id:'overview',      icon:BarChart2,   label:'Overview'   },
  { id:'waves',         icon:Layers,      label:'Waves'      },
  { id:'assets',        icon:GitBranch,   label:'Assets'     },
  { id:'architecture',  icon:GitBranch,   label:'Architecture'},
  { id:'costs',         icon:DollarSign,  label:'Costs'      },
  { id:'security',      icon:Shield,      label:'Security'   },
  { id:'deployment',    icon:CheckSquare, label:'Deployment' },
];

const fmt$ = n => `$${Number(n).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';

export default function MigrationPlanDetail() {
  const { id } = useParams();
  const [plan,    setPlan]    = useState(null);
  const [tab,     setTab]     = useState('overview');
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [waveFilter, setWaveFilter] = useState('all');

  useEffect(() => {
    fetch(`/api/v1/planner/plans/${id}`)
      .then(r => r.json())
      .then(d => { setPlan(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding:28, color:'#475569', textAlign:'center' }}>Loading migration plan…</div>;
  if (!plan)   return <div style={{ padding:28, color:'#f87171' }}>Plan not found.</div>;

  const fin = plan.financials || {};

  return (
    <div style={{ padding:28 }}>
      {/* Back */}
      <Link to="/planner" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#475569', textDecoration:'none', fontSize:13, marginBottom:20 }}>
        <ArrowLeft size={13}/> Back to Planner
      </Link>

      {/* Plan header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>{plan.project_name}</h1>
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              <span className="badge badge-blue">{plan.provider.toUpperCase()}</span>
              <span className="badge badge-gray">{plan.total_assets} assets</span>
              <span className="badge badge-gray">{plan.total_waves} waves</span>
              <span className="badge badge-gray">{plan.total_weeks} weeks</span>
              <span className="badge badge-amber">Generated {fmtDate(plan.generated_at)}</span>
            </div>
          </div>
        </div>
        {plan.executive_summary && (
          <div style={{ marginTop:14, background:'#0d1d3a', border:'1px solid #1e3a5f', borderRadius:8, padding:'12px 16px', fontSize:13, color:'#94a3b8', lineHeight:1.7 }}>
            📋 {plan.executive_summary}
          </div>
        )}
      </div>

      {/* KPI bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Assets',      value: plan.total_assets,             color:'#60a5fa', icon:'🖥️' },
          { label:'Migration Cost',    value: fmt$(fin.total_migration_cost), color:'#fbbf24', icon:'💰' },
          { label:'Monthly Cloud',     value: fmt$(fin.monthly_cloud_run_cost), color:'#34d399',icon:'☁' },
          { label:'Annual Savings',    value: fmt$(fin.annual_savings),       color:'#34d399', icon:'📈' },
          { label:'ROI Break-even',    value: `${fin.roi_months}mo`,          color:'#c084fc', icon:'🎯' },
          { label:'3-Year Net Savings',value: fmt$(fin.three_year_savings),   color:'#34d399', icon:'🏆' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:18, marginBottom:6 }}>{kpi.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:kpi.color, lineHeight:1 }}>{kpi.value}</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:4, textTransform:'uppercase', letterSpacing:.5 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #1e2d45', overflowX:'auto' }}>
        {TABS.map(({ id:tid, icon:Icon, label }) => (
          <button key={tid} onClick={() => setTab(tid)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
            background:'none', border:'none', borderBottom:`2px solid ${tab===tid?'#60a5fa':'transparent'}`,
            color: tab===tid?'#e2e8f0':'#64748b', cursor:'pointer', fontSize:13, fontWeight: tab===tid?600:400,
            whiteSpace:'nowrap', transition:'all .12s',
          }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* ── Tabs ── */}
      {tab === 'overview'      && <OverviewTab     plan={plan} fin={fin} />}
      {tab === 'waves'         && <WavesTab        plan={plan} />}
      {tab === 'assets'        && <AssetsTab       plan={plan} search={search} setSearch={setSearch} waveFilter={waveFilter} setWaveFilter={setWaveFilter} />}
      {tab === 'architecture'  && <ArchitectureTab plan={plan} />}
      {tab === 'costs'         && <CostsTab        plan={plan} fin={fin} />}
      {tab === 'security'      && <SecurityTab     plan={plan} />}
      {tab === 'deployment'    && <DeploymentTab   plan={plan} />}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ plan, fin }) {
  const waveData = (plan.waves||[]).map(w => ({
    name: `W${w.wave_number}`,
    assets: w.asset_count,
    weeks: w.duration_weeks,
    cost: Math.round(w.migration_cost / 1000),
    monthly: Math.round(w.monthly_cloud_cost),
  }));

  const stratDist = Object.entries(plan.strategy_distribution||{}).map(([k,v]) => ({ name:k, value:v }));
  const typeDist  = Object.entries(plan.asset_type_distribution||{}).map(([k,v]) => ({ name:k, value:v }));

  // Cumulative cost line
  let cumCost = 0;
  const costLine = (plan.waves||[]).map(w => {
    cumCost += w.migration_cost;
    return { name:`W${w.wave_number}`, cumulative: Math.round(cumCost), savings: Math.round(w.monthly_cloud_cost * 12 * 0.4) };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Wave timeline bar */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Wave Timeline — Assets & Duration</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={waveData} barSize={20}>
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }} />
              <Bar dataKey="assets" name="Assets" radius={[4,4,0,0]}>
                {waveData.map((_,i) => <Cell key={i} fill={WAVE_COLORS[i % WAVE_COLORS.length]} />)}
              </Bar>
              <Bar dataKey="weeks" name="Weeks" radius={[4,4,0,0]} fill="#1e2d45" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Migration strategy pie */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Migration Strategy Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stratDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,value}) => `${name}: ${value}`} labelLine={false} style={{fontSize:10}}>
                {stratDist.map((_,i) => <Cell key={i} fill={Object.values(STRAT_COLOR)[i % 3]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Asset type distribution */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Asset Types</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeDist} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }} />
              <Bar dataKey="value" name="Count" radius={[0,4,4,0]}>
                {typeDist.map((_,i) => <Cell key={i} fill={WAVE_COLORS[i % WAVE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cumulative cost line */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Cumulative Migration Investment ($k)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={costLine}>
              <CartesianGrid stroke="#1e2d45" strokeDasharray="4 4" />
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} unit="k" />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }} />
              <Line dataKey="cumulative" name="Cumulative cost ($k)" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill:'#fbbf24', r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Waves tab ─────────────────────────────────────────────────────────────────
function WavesTab({ plan }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Gantt-style timeline */}
      <div className="card" style={{ padding:20, marginBottom:8 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Migration Timeline</div>
        <div style={{ overflowX:'auto' }}>
          {(plan.waves||[]).map((w,i) => {
            const start = new Date(w.start_date);
            const end   = new Date(w.end_date);
            const totalWeeks = plan.total_weeks || 1;
            const offset = i === 0 ? 0 : Math.round((plan.waves.slice(0,i).reduce((s,pw) => s + pw.duration_weeks, 0) / totalWeeks) * 100);
            const width  = Math.round((w.duration_weeks / totalWeeks) * 100);
            return (
              <div key={w.wave_number} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b', marginBottom:4 }}>
                  <span style={{ fontWeight:600, color:WAVE_COLORS[i%5] }}>Wave {w.wave_number}</span>
                  <span>{fmtDate(w.start_date)} → {fmtDate(w.end_date)} ({w.duration_weeks}w)</span>
                </div>
                <div style={{ background:'#0a0f1e', borderRadius:4, height:24, position:'relative', overflow:'hidden' }}>
                  <div style={{
                    position:'absolute', left:`${offset}%`, width:`${Math.max(width,2)}%`,
                    height:'100%', borderRadius:4, background:`${WAVE_COLORS[i%5]}33`,
                    border:`1.5px solid ${WAVE_COLORS[i%5]}`,
                    display:'flex', alignItems:'center', paddingLeft:8,
                    fontSize:10, color: WAVE_COLORS[i%5], fontWeight:700, whiteSpace:'nowrap',
                  }}>
                    {w.asset_count} assets
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wave cards */}
      {(plan.waves||[]).map((w,i) => (
        <div key={w.wave_number} className="card" style={{ overflow:'hidden' }}>
          <div
            onClick={() => setExpanded(expanded === w.wave_number ? null : w.wave_number)}
            style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}
          >
            <div style={{ width:40, height:40, borderRadius:10, background:`${WAVE_COLORS[i%5]}20`, border:`2px solid ${WAVE_COLORS[i%5]}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:WAVE_COLORS[i%5], flexShrink:0 }}>
              {w.wave_number}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0' }}>{w.name}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{w.description}</div>
            </div>
            <div style={{ display:'flex', gap:16, alignItems:'center', flexShrink:0, textAlign:'right' }}>
              <Stat label="Assets"  value={w.asset_count} />
              <Stat label="Weeks"   value={w.duration_weeks} />
              <Stat label="Cost"    value={fmt$(w.migration_cost)} />
              <Stat label="Monthly" value={fmt$(w.monthly_cloud_cost)} />
              <span className={`badge ${RISK_BADGE[w.risk_level]||'badge-gray'}`}>{w.risk_level} risk</span>
              <span style={{ color:'#475569', fontSize:14 }}>{expanded===w.wave_number?'▲':'▼'}</span>
            </div>
          </div>

          {expanded === w.wave_number && (
            <div style={{ padding:'0 20px 20px', borderTop:'1px solid #1e2d45' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
                {/* Assets in wave */}
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#60a5fa', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>Assets in this wave</div>
                  {w.assets.map(a => (
                    <div key={a.id} style={{ padding:'8px 0', borderBottom:'1px solid #0d1424', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{a.name}</div>
                        <div style={{ fontSize:10, color:'#475569' }}>{a.asset_type} · {a.strategy}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <span className={`badge ${a.criticality==='critical'?'badge-red':a.criticality==='high'?'badge-amber':'badge-gray'}`}>{a.criticality}</span>
                        <span style={{ fontSize:10, color:STRAT_COLOR[a.strategy_code]||'#64748b' }}>{a.strategy_code}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risks & Success */}
                <div>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#f87171', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Key Risks</div>
                    {(w.key_risks||[]).map((r,ri) => (
                      <div key={ri} style={{ display:'flex', gap:6, fontSize:12, color:'#fca5a5', marginBottom:6 }}>
                        <AlertTriangle size={12} color="#f87171" style={{ flexShrink:0, marginTop:1 }}/>{r}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#34d399', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Success Criteria</div>
                    {(w.success_criteria||[]).map((c,ci) => (
                      <div key={ci} style={{ display:'flex', gap:6, fontSize:12, color:'#86efac', marginBottom:5 }}>
                        <span>✓</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Assets tab ────────────────────────────────────────────────────────────────
function AssetsTab({ plan, search, setSearch, waveFilter, setWaveFilter }) {
  const filtered = (plan.assets||[]).filter(a =>
    (waveFilter === 'all' || String(a.wave) === waveFilter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.asset_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input placeholder="Search assets…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, background:'#070d1a', border:'1px solid #1e2d45', borderRadius:8, color:'#e2e8f0', padding:'8px 12px', fontSize:13, outline:'none' }} />
        <select value={waveFilter} onChange={e=>setWaveFilter(e.target.value)}
          style={{ background:'#070d1a', border:'1px solid #1e2d45', borderRadius:8, color:'#94a3b8', padding:'8px 12px', fontSize:13, outline:'none' }}>
          <option value="all">All waves</option>
          {(plan.waves||[]).map(w => <option key={w.wave_number} value={String(w.wave_number)}>Wave {w.wave_number}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #1e2d45' }}>
              {['Asset','Type','Wave','Strategy','Target Service','Complexity','Criticality','Monthly Cost','Effort'].map(h => (
                <th key={h} style={{ padding:'10px 12px', fontSize:10, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:.5, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a,i) => (
              <tr key={a.id} style={{ borderBottom:'1px solid #0d1424', background: i%2===0?'transparent':'#050810' }}>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{a.name}</div>
                  <div style={{ fontSize:10, color:'#475569' }}>{a.environment} · {a.current_platform}</div>
                </td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'#94a3b8' }}>{a.asset_type}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ background:`${WAVE_COLORS[(a.wave-1)%5]}25`, color:WAVE_COLORS[(a.wave-1)%5], padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700 }}>W{a.wave}</span>
                </td>
                <td style={{ padding:'10px 12px', fontSize:12, color:STRAT_COLOR[a.strategy_code]||'#64748b', fontWeight:600 }}>{a.strategy}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'#94a3b8' }}>{a.target_service}</td>
                <td style={{ padding:'10px 12px' }}><span className={`badge ${a.complexity==='very-high'||a.complexity==='high'?'badge-red':a.complexity==='medium'?'badge-amber':'badge-green'}`}>{a.complexity}</span></td>
                <td style={{ padding:'10px 12px' }}><span className={`badge ${a.criticality==='critical'?'badge-red':a.criticality==='high'?'badge-amber':'badge-gray'}`}>{a.criticality}</span></td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'#34d399', fontWeight:600 }}>{fmt$(a.cost?.monthly_cloud_cost||0)}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'#94a3b8' }}>{a.cost?.effort_weeks||0}w</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:'#334155' }}>No assets match filter</div>}
      </div>
      <div style={{ fontSize:11, color:'#374151', marginTop:8, textAlign:'right' }}>Showing {filtered.length} of {plan.assets?.length||0} assets</div>
    </div>
  );
}

// ── Architecture tab ──────────────────────────────────────────────────────────
function ArchitectureTab({ plan }) {
  const grouped = {};
  (plan.assets||[]).forEach(a => {
    const t = a.asset_type;
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(a);
  });

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      {Object.entries(grouped).map(([type, assets]) => (
        <div key={type} className="card" style={{ padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{assets[0]?.target_service?.includes('RDS')||type==='Database'?'🗄️':type==='Web Server'?'🌐':type==='App Server'?'⚙️':type==='Cache'?'⚡':type==='Load Balancer'?'⚖️':type==='Container'?'🐳':'💻'}</span>
            {type} ({assets.length})
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ flex:1, background:'#0a0f1e', border:'1px solid #1e2d45', borderRadius:7, padding:'8px 12px', fontSize:11, color:'#64748b' }}>
              <div style={{ fontWeight:700, color:'#94a3b8', marginBottom:3 }}>ON-PREMISE</div>
              <div>{assets[0]?.current_platform || 'VMware/Bare Metal'}</div>
            </div>
            <div style={{ fontSize:18, color:'#475569' }}>→</div>
            <div style={{ flex:1, background:'#0d1d3a', border:'1px solid #1e3a5f', borderRadius:7, padding:'8px 12px', fontSize:11, color:'#60a5fa' }}>
              <div style={{ fontWeight:700, color:'#60a5fa', marginBottom:3 }}>{plan.provider.toUpperCase()} TARGET</div>
              <div style={{ fontWeight:600 }}>{assets[0]?.target_service}</div>
              <div style={{ color:'#475569', marginTop:2 }}>Managed: {assets[0]?.managed_option}</div>
            </div>
          </div>
          {/* Architecture notes */}
          {assets[0]?.architecture_notes?.map((n,i) => (
            <div key={i} style={{ fontSize:11, color:'#64748b', paddingLeft:10, borderLeft:'2px solid #1e3a5f', marginBottom:5 }}>→ {n}</div>
          ))}
          <div style={{ marginTop:10, fontSize:10, color:'#4c1d95', background:'#1a0d2e', padding:'3px 8px', borderRadius:4, display:'inline-block' }}>
            TF: {assets[0]?.terraform_resource}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Costs tab ─────────────────────────────────────────────────────────────────
function CostsTab({ plan, fin }) {
  const waveCostData = (plan.waves||[]).map(w => ({
    name: `Wave ${w.wave_number}`,
    'Migration Cost': Math.round(w.migration_cost),
    'Annual Cloud': Math.round(w.monthly_cloud_cost * 12),
  }));

  const assetCostData = (plan.assets||[])
    .sort((a,b) => (b.cost?.monthly_cloud_cost||0) - (a.cost?.monthly_cloud_cost||0))
    .slice(0, 12)
    .map(a => ({ name: a.name.length > 14 ? a.name.slice(0,13)+'…' : a.name, monthly: Math.round(a.cost?.monthly_cloud_cost||0) }));

  const breakdownData = [
    { name:'Compute', value: Math.round((plan.assets||[]).reduce((s,a) => s+(a.cost?.breakdown?.compute||0),0)) },
    { name:'Storage', value: Math.round((plan.assets||[]).reduce((s,a) => s+(a.cost?.breakdown?.storage||0),0)) },
    { name:'Database',value: Math.round((plan.assets||[]).reduce((s,a) => s+(a.cost?.breakdown?.database||0),0)) },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Financial summary */}
      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Financial Summary</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {[
            ['💸 Migration Investment', fmt$(fin.total_migration_cost), '#fbbf24', 'One-time cost to migrate all assets'],
            ['☁ Monthly Cloud', fmt$(fin.monthly_cloud_run_cost), '#60a5fa', 'Ongoing cloud infrastructure cost'],
            ['📊 Annual Cloud', fmt$(fin.annual_cloud_run_cost), '#60a5fa', 'Annual cloud run cost'],
            ['🏢 Est. On-Prem', fmt$(fin.estimated_on_prem_cost), '#f87171', 'Estimated current on-prem annual cost'],
            ['✅ Annual Saving', fmt$(fin.annual_savings), '#34d399', 'Annual savings vs on-premise'],
            ['🏆 3-Year Net', fmt$(fin.three_year_savings), '#34d399', '3-year net savings after migration cost'],
          ].map(([label, val, color, sub]) => (
            <div key={label} style={{ background:'#070d1a', border:`1px solid ${color}30`, borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:11, color:'#475569', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:20, fontWeight:800, color }}>{val}</div>
              <div style={{ fontSize:10, color:'#374151', marginTop:3 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Cost by Wave</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waveCostData} barSize={22}>
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }}
                formatter={v => [`$${v.toLocaleString()}`, '']} />
              <Bar dataKey="Migration Cost" fill="#fbbf24" radius={[4,4,0,0]} />
              <Bar dataKey="Annual Cloud"   fill="#60a5fa" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Monthly Cost Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={breakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                {breakdownData.map((_,i) => <Cell key={i} fill={['#60a5fa','#34d399','#c084fc'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }}
                formatter={v => [`$${v.toLocaleString()}/mo`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Top Assets by Monthly Cost</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={assetCostData} layout="vertical" barSize={14}>
            <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
            <YAxis dataKey="name" type="category" width={130} tick={{ fill:'#94a3b8', fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }}
              formatter={v => [`$${v}/mo`, 'Monthly']} />
            <Bar dataKey="monthly" radius={[0,4,4,0]}>
              {assetCostData.map((_,i) => <Cell key={i} fill={WAVE_COLORS[i%5]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────
function SecurityTab({ plan }) {
  const sec = plan.security_summary || {};
  const highRisk = sec.high_risk_assets || [];

  // Build per-wave security matrix
  const perWave = (plan.waves||[]).map(w => {
    const checks = new Set();
    w.assets.forEach(a => (a.security_checks||[]).forEach(c => checks.add(c)));
    return { wave_number: w.wave_number, name: w.name, checks: Array.from(checks) };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* High-risk assets */}
      {highRisk.length > 0 && (
        <div style={{ background:'#1a0505', border:'1px solid #7f1d1d', borderRadius:8, padding:'14px 18px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#f87171', marginBottom:8 }}>🔴 High-Risk / Sensitive Data Assets</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {highRisk.map(a => <span key={a} style={{ background:'#7f1d1d30', color:'#fca5a5', padding:'3px 10px', borderRadius:10, fontSize:12, border:'1px solid #7f1d1d' }}>{a}</span>)}
          </div>
          <div style={{ marginTop:10, fontSize:12, color:'#fca5a5' }}>These assets contain restricted/confidential data and require compliance sign-off before migration.</div>
        </div>
      )}

      {/* Security checks per wave */}
      {perWave.map((w,i) => (
        <div key={w.wave_number} className="card" style={{ padding:18 }}>
          <div style={{ fontSize:13, fontWeight:700, color:WAVE_COLORS[i%5], marginBottom:14 }}>Wave {w.wave_number} Security Checklist</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {w.checks.map(c => (
              <div key={c} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#070d1a', border:'1px solid #1e2d45', borderRadius:7 }}>
                <div style={{ width:18, height:18, borderRadius:4, border:'1.5px solid #1e3a5f', background:'#0a1628', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ color:'#60a5fa', fontSize:11 }}>□</span>
                </div>
                <span style={{ fontSize:12, color:'#94a3b8' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Deployment tab ────────────────────────────────────────────────────────────
function DeploymentTab({ plan }) {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const asset = selectedAsset
    ? (plan.assets||[]).find(a => a.id === selectedAsset)
    : (plan.waves||[])[0]?.assets?.[0];

  const phases = ['Pre-Migration','Migration','Cutover','Post-Migration'];
  const PHASE_COLORS = { 'Pre-Migration':'#60a5fa','Migration':'#fbbf24','Cutover':'#f87171','Post-Migration':'#34d399' };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16, minHeight:400 }}>
      {/* Asset list */}
      <div className="card" style={{ padding:12, overflowY:'auto', maxHeight:600 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Select Asset</div>
        {(plan.assets||[]).map(a => (
          <button key={a.id} onClick={() => setSelectedAsset(a.id)} style={{
            width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:6, marginBottom:4,
            background: asset?.id===a.id ? '#0d1d3a' : 'transparent',
            border:`1px solid ${asset?.id===a.id?'#1e3a5f':'transparent'}`,
            color: asset?.id===a.id ? '#60a5fa' : '#64748b', cursor:'pointer', fontSize:12,
          }}>
            <div style={{ fontWeight:600 }}>{a.name}</div>
            <div style={{ fontSize:10, opacity:.7 }}>W{a.wave} · {a.strategy}</div>
          </button>
        ))}
      </div>

      {/* Deployment steps */}
      {asset ? (
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', marginBottom:4 }}>{asset.name}</div>
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            <span className="badge badge-gray">{asset.asset_type}</span>
            <span style={{ fontSize:11, color:STRAT_COLOR[asset.strategy_code], fontWeight:700 }}>{asset.strategy}</span>
            <span style={{ fontSize:11, color:'#60a5fa' }}>→ {asset.target_service}</span>
          </div>

          {phases.map(phase => {
            const steps = (asset.deployment_steps||[]).filter(s => s.phase === phase);
            if (!steps.length) return null;
            return (
              <div key={phase} style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:PHASE_COLORS[phase], marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:PHASE_COLORS[phase] }} />
                  {phase}
                  <div style={{ height:1, flex:1, background:`${PHASE_COLORS[phase]}40` }} />
                </div>
                {steps.map((s,i) => (
                  <div key={i} style={{ display:'flex', gap:12, marginBottom:10, paddingLeft:18 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${PHASE_COLORS[phase]}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:PHASE_COLORS[phase] }}>{i+1}</div>
                      {i < steps.length-1 && <div style={{ width:1, flex:1, minHeight:12, background:`${PHASE_COLORS[phase]}30`, marginTop:3 }} />}
                    </div>
                    <div style={{ paddingBottom:8 }}>
                      <div style={{ fontSize:13, color:'#e2e8f0' }}>{s.step}</div>
                      <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>
                        Owner: <span style={{ color:'#94a3b8' }}>{s.owner}</span>
                        {' · '}Est: <span style={{ color:'#60a5fa' }}>{s.days} day{s.days>1?'s':''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding:40, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155' }}>
          Select an asset to view its deployment steps
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9, color:'#475569', marginTop:2, textTransform:'uppercase', letterSpacing:.4 }}>{label}</div>
    </div>
  );
}
