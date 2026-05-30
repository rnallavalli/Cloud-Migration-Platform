import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { getProjects, createProject } from '../api/client';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const ORG = 'org-001';
const STATUS_COLOR = { completed:'badge-green','in-progress':'badge-blue',planning:'badge-amber','on-hold':'badge-red' };
const CLOUDS = ['aws','azure','gcp','private','multi'];
const STRATEGIES = ['lift-shift','replatform','refactor','repurchase','retire'];
const CLOUD_COLORS = { aws:'#ff9900', azure:'#0078d4', gcp:'#4285f4', private:'#94a3b8', multi:'#c084fc' };

export default function Projects() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name:'', description:'', target_cloud:'aws', migration_type:'lift-shift', expected_duration_months:6, budget:'' });

  const load = () => { setLoading(true); getProjects(ORG).then(r=>setItems(r.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[]);

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createProject({ ...form, organization_id:ORG, budget:form.budget?Number(form.budget):undefined });
      setModal(false);
      setForm({ name:'', description:'', target_cloud:'aws', migration_type:'lift-shift', expected_duration_months:6, budget:'' });
      load();
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Migration Projects</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#475569' }}>Track and manage cloud migration projects</p>
        </div>
        <button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/> New Project</button>
      </div>

      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
        <input placeholder="Search projects…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34 }} />
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'#475569' }}>Loading…</div>
      : filtered.length===0 ? (
        <EmptyState icon="📁" title="No projects found" sub="Create your first migration project to start planning."
          action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/> New Project</button>} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
          {filtered.map(p=>(
            <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration:'none' }}>
              <div className="card" style={{ padding:18, height:'100%', transition:'border-color .15s', cursor:'pointer' }}
                   onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}
                   onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2d45'}>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0', marginBottom:4 }}>{p.name}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:CLOUD_COLORS[p.target_cloud]||'#94a3b8', background:`${CLOUD_COLORS[p.target_cloud]}18`, padding:'2px 7px', borderRadius:10, border:`1px solid ${CLOUD_COLORS[p.target_cloud]}30` }}>
                        {p.target_cloud.toUpperCase()}
                      </span>
                      <span className="badge badge-gray">{p.migration_type}</span>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLOR[p.status]||'badge-gray'}`}>{p.status}</span>
                </div>
                {/* Progress bar */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#475569', marginBottom:5 }}>
                    <span>Progress</span><span>{p.progress_percentage||0}%</span>
                  </div>
                  <div style={{ height:5, background:'#0a0f1e', borderRadius:3 }}>
                    <div style={{ height:'100%', width:`${p.progress_percentage||0}%`, background:'linear-gradient(90deg,#1d4ed8,#4f46e5)', borderRadius:3, transition:'width .5s' }} />
                  </div>
                </div>
                {/* Stats */}
                <div style={{ display:'flex', gap:16, fontSize:11, color:'#475569' }}>
                  <span>🏗 {p.waves?.length||0} waves</span>
                  <span>📦 {p.applications_count||0} apps</span>
                  {p.expected_duration_months && <span>📅 {p.expected_duration_months}mo</span>}
                  {p.budget && <span>💰 ${p.budget?.toLocaleString()}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Migration Project" onClose={()=>setModal(false)} width={560}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label>Project Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. AWS Phase 1 Migration" /></div>
            <div><label>Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="Optional…" style={{resize:'vertical'}} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label>Target Cloud</label>
                <select value={form.target_cloud} onChange={e=>setForm(f=>({...f,target_cloud:e.target.value}))}>
                  {CLOUDS.map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
              <div><label>Migration Strategy</label>
                <select value={form.migration_type} onChange={e=>setForm(f=>({...f,migration_type:e.target.value}))}>
                  {STRATEGIES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label>Duration (months)</label><input type="number" min={1} value={form.expected_duration_months} onChange={e=>setForm(f=>({...f,expected_duration_months:Number(e.target.value)}))} /></div>
              <div><label>Budget (USD)</label><input type="number" min={0} value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))} placeholder="e.g. 250000" /></div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
              <button className="btn-outline" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={submit} disabled={saving||!form.name.trim()}>{saving?'Creating…':'Create Project'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
