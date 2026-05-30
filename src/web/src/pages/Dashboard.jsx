import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FolderKanban, CheckCircle, AlertTriangle, TrendingUp, Server } from 'lucide-react';
import { getAssessments, getProjects } from '../api/client';
import StatCard from '../components/StatCard';
import ScoreBar from '../components/ScoreBar';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ORG = 'org-001';
const STATUS_COLOR = { completed:'badge-green', 'in-progress':'badge-blue', planning:'badge-amber', created:'badge-gray', failed:'badge-red' };

export default function Dashboard() {
  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([getAssessments(ORG), getProjects(ORG)])
      .then(([a, p]) => { setAssessments(a.data); setProjects(p.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = assessments.filter(a => a.status === 'completed');
  const avgScore  = completed.length
    ? Math.round(completed.reduce((s, a) => s + (a.scores?.overall_score || 0), 0) / completed.length)
    : null;

  const latest = completed[completed.length - 1];
  const radarData = latest ? [
    { axis:'Business',     value: latest.scores.business_readiness      || 0 },
    { axis:'Technical',    value: latest.scores.technical_readiness     || 0 },
    { axis:'Org',          value: latest.scores.organizational_readiness || 0 },
    { axis:'Security',     value: latest.scores.security_compliance     || 0 },
  ] : [];

  const barData = projects.map(p => ({
    name: p.name.length > 14 ? p.name.slice(0,14)+'…' : p.name,
    progress: p.progress_percentage || 0,
  }));

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#475569' }}>Loading dashboard…</div>;

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Dashboard</h1>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#475569' }}>Cloud Migration Platform — Organization overview</p>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
        <StatCard label="Total Assessments" value={assessments.length} icon={ClipboardList} color="#60a5fa" sub={`${completed.length} completed`} />
        <StatCard label="Active Projects"   value={projects.length}    icon={FolderKanban}  color="#34d399" sub={`${projects.filter(p=>p.status==='in-progress').length} in progress`} />
        <StatCard label="Avg Readiness"     value={avgScore != null ? `${avgScore}%` : 'N/A'} icon={TrendingUp} color={avgScore>=70?'#34d399':avgScore>=50?'#fbbf24':'#f87171'} sub="across completed assessments" />
        <StatCard label="Total Resources"   value={projects.reduce((s,p)=>s+(p.applications_count||0),0)} icon={Server} color="#c084fc" sub="applications tracked" />
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {/* Radar */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Latest Assessment Scores</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2d45" />
                <PolarAngleAxis dataKey="axis" tick={{ fill:'#64748b', fontSize:11 }} />
                <Radar dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#1e2d45', fontSize:12 }}>
              Complete an assessment to see scores
            </div>
          )}
        </div>

        {/* Bar — project progress */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Project Progress</div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={22}>
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, fontSize:12 }} />
                <Bar dataKey="progress" radius={[4,4,0,0]}>
                  {barData.map((_, i) => <Cell key={i} fill={['#3b82f6','#34d399','#c084fc','#fbbf24'][i%4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center', color:'#1e2d45', fontSize:12 }}>
              Create a project to track progress
            </div>
          )}
        </div>
      </div>

      {/* Recent lists */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Assessments */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>Recent Assessments</span>
            <Link to="/assessments" style={{ fontSize:11, color:'#3b82f6', textDecoration:'none' }}>View all →</Link>
          </div>
          {assessments.slice(-5).reverse().map(a => (
            <Link key={a.id} to={`/assessments/${a.id}`} style={{ textDecoration:'none', display:'block' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #0d1424' }}>
                <div>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{a.name}</div>
                  <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{a.assessment_type} · {a.scope}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {a.scores?.overall_score != null && <span style={{ fontSize:12, fontWeight:700, color:'#60a5fa' }}>{a.scores.overall_score}%</span>}
                  <span className={`badge ${STATUS_COLOR[a.status] || 'badge-gray'}`}>{a.status}</span>
                </div>
              </div>
            </Link>
          ))}
          {assessments.length === 0 && <div style={{ fontSize:12, color:'#1e2d45', padding:'20px 0', textAlign:'center' }}>No assessments yet</div>}
        </div>

        {/* Projects */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>Recent Projects</span>
            <Link to="/projects" style={{ fontSize:11, color:'#3b82f6', textDecoration:'none' }}>View all →</Link>
          </div>
          {projects.slice(-5).reverse().map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration:'none', display:'block' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #0d1424' }}>
                <div>
                  <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:500 }}>{p.name}</div>
                  <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{p.target_cloud.toUpperCase()} · {p.migration_type}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{p.progress_percentage || 0}%</div>
                  <span className={`badge ${STATUS_COLOR[p.status] || 'badge-gray'}`}>{p.status}</span>
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && <div style={{ fontSize:12, color:'#1e2d45', padding:'20px 0', textAlign:'center' }}>No projects yet</div>}
        </div>
      </div>
    </div>
  );
}
