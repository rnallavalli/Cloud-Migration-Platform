import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Layers, Box } from 'lucide-react';
import { getProject, updateProject, createWave, addApplication } from '../api/client';
import Modal from '../components/Modal';

const STATUS_COLOR = { completed:'badge-green','in-progress':'badge-blue',planning:'badge-amber','on-hold':'badge-red',planned:'badge-gray',blocked:'badge-red' };
const COMPLEXITY = ['low','medium','high','very-high'];
const CRITICALITY = ['low','medium','high','critical'];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project,    setProject]   = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [waveModal,  setWaveModal] = useState(false);
  const [appModal,   setAppModal]  = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [waveForm,   setWaveForm]  = useState({ wave_number:1, name:'', description:'', applications_count:0, data_size_gb:'' });
  const [appForm,    setAppForm]   = useState({ name:'', description:'', current_platform:'', target_platform:'', complexity_level:'medium', criticality:'medium' });

  const load = () => { setLoading(true); getProject(id).then(r=>setProject(r.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[id]);

  const saveWave = async () => {
    setSaving(true);
    try { await createWave(id, waveForm); setWaveModal(false); load(); }
    catch(e) { alert(e.message); } finally { setSaving(false); }
  };

  const saveApp = async () => {
    setSaving(true);
    try { await addApplication(id, appForm); setAppModal(false); load(); }
    catch(e) { alert(e.message); } finally { setSaving(false); }
  };

  const updateStatus = async (status) => {
    try { await updateProject(id, { status }); load(); } catch(e) { alert(e.message); }
  };

  const updateProgress = async (progress_percentage) => {
    try { await updateProject(id, { progress_percentage }); load(); } catch(e) { alert(e.message); }
  };

  if (loading) return <div style={{ padding:28, color:'#475569' }}>Loading…</div>;
  if (!project) return <div style={{ padding:28, color:'#f87171' }}>Project not found.</div>;

  return (
    <div style={{ padding:28 }}>
      <Link to="/projects" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#475569', textDecoration:'none', fontSize:13, marginBottom:20 }}>
        <ArrowLeft size={13}/> All Projects
      </Link>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>{project.name}</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <span className={`badge ${STATUS_COLOR[project.status]||'badge-gray'}`}>{project.status}</span>
            <span className="badge badge-gray">{project.target_cloud.toUpperCase()}</span>
            <span className="badge badge-gray">{project.migration_type}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-outline" onClick={()=>setWaveModal(true)}><Layers size={13}/> Add Wave</button>
          <button className="btn-primary" onClick={()=>setAppModal(true)}><Plus size={13}/> Add App</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        {/* Progress */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Project Progress</div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569', marginBottom:6 }}>
            <span>Completion</span><span>{project.progress_percentage||0}%</span>
          </div>
          <div style={{ height:10, background:'#070d1a', borderRadius:5, marginBottom:16 }}>
            <div style={{ height:'100%', width:`${project.progress_percentage||0}%`, background:'linear-gradient(90deg,#1d4ed8,#34d399)', borderRadius:5, transition:'width .5s' }} />
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[0,25,50,75,100].map(p=>(
              <button key={p} onClick={()=>updateProgress(p)}
                style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, border:`1px solid ${project.progress_percentage===p?'#3b82f6':'#1e2d45'}`, background: project.progress_percentage===p?'#0d1d3a':'transparent', color: project.progress_percentage===p?'#60a5fa':'#64748b', cursor:'pointer' }}>
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Details</div>
          {[
            ['Status', project.status],
            ['Duration', project.expected_duration_months ? `${project.expected_duration_months} months` : '—'],
            ['Budget', project.budget ? `$${project.budget?.toLocaleString()}` : '—'],
            ['Waves', (project.waves||[]).length],
            ['Applications', project.applications_count||0],
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, paddingBottom:8, marginBottom:8, borderBottom:'1px solid #0d1424' }}>
              <span style={{ color:'#475569' }}>{k}</span>
              <span style={{ color:'#94a3b8', fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
            {['planning','in-progress','completed','on-hold'].map(s=>(
              <button key={s} onClick={()=>updateStatus(s)}
                style={{ padding:'3px 8px', borderRadius:5, fontSize:10, fontWeight:600, border:`1px solid ${project.status===s?'#3b82f6':'#1e2d45'}`, background: project.status===s?'#0d1d3a':'transparent', color: project.status===s?'#60a5fa':'#475569', cursor:'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Waves */}
      <div className="card" style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>Migration Waves ({(project.waves||[]).length})</div>
          <button className="btn-outline" style={{ padding:'4px 12px', fontSize:11 }} onClick={()=>setWaveModal(true)}><Layers size={11}/> Add</button>
        </div>
        {(project.waves||[]).length===0 ? (
          <div style={{ fontSize:12, color:'#334155', textAlign:'center', padding:'20px 0' }}>No waves defined — add migration waves to organise your project</div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {project.waves.map(w=>(
              <div key={w.id} style={{ background:'#070d1a', border:'1px solid #1e2d45', borderRadius:8, padding:'14px 16px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#0d1d3a', border:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#60a5fa', flexShrink:0 }}>
                  {w.wave_number}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>{w.name}</div>
                  {w.description && <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{w.description}</div>}
                </div>
                <div style={{ display:'flex', gap:12, fontSize:11, color:'#475569', flexShrink:0 }}>
                  <span>📦 {w.applications_count} apps</span>
                  {w.data_size_gb && <span>💾 {w.data_size_gb}GB</span>}
                  <span className={`badge ${STATUS_COLOR[w.status]||'badge-gray'}`}>{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wave Modal */}
      {waveModal && (
        <Modal title="Add Migration Wave" onClose={()=>setWaveModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:12 }}>
              <div><label>Wave #</label><input type="number" min={1} value={waveForm.wave_number} onChange={e=>setWaveForm(f=>({...f,wave_number:Number(e.target.value)}))} /></div>
              <div><label>Wave Name *</label><input value={waveForm.name} onChange={e=>setWaveForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Wave 1: Quick Wins" /></div>
            </div>
            <div><label>Description</label><input value={waveForm.description} onChange={e=>setWaveForm(f=>({...f,description:e.target.value}))} placeholder="Optional" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label>App Count</label><input type="number" min={0} value={waveForm.applications_count} onChange={e=>setWaveForm(f=>({...f,applications_count:Number(e.target.value)}))} /></div>
              <div><label>Data Size (GB)</label><input type="number" min={0} value={waveForm.data_size_gb} onChange={e=>setWaveForm(f=>({...f,data_size_gb:e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-outline" onClick={()=>setWaveModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveWave} disabled={saving||!waveForm.name}>{saving?'Saving…':'Add Wave'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* App Modal */}
      {appModal && (
        <Modal title="Add Application" onClose={()=>setAppModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label>App Name *</label><input value={appForm.name} onChange={e=>setAppForm(f=>({...f,name:e.target.value}))} placeholder="e.g. CRM Service" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label>Current Platform</label><input value={appForm.current_platform} onChange={e=>setAppForm(f=>({...f,current_platform:e.target.value}))} placeholder="e.g. linux, aix" /></div>
              <div><label>Target Platform</label><input value={appForm.target_platform} onChange={e=>setAppForm(f=>({...f,target_platform:e.target.value}))} placeholder="e.g. kubernetes" /></div>
              <div><label>Complexity</label>
                <select value={appForm.complexity_level} onChange={e=>setAppForm(f=>({...f,complexity_level:e.target.value}))}>
                  {COMPLEXITY.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label>Criticality</label>
                <select value={appForm.criticality} onChange={e=>setAppForm(f=>({...f,criticality:e.target.value}))}>
                  {CRITICALITY.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-outline" onClick={()=>setAppModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveApp} disabled={saving||!appForm.name}>{saving?'Saving…':'Add Application'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
