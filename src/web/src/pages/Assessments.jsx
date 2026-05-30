import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { getAssessments, createAssessment } from '../api/client';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const ORG = 'org-001';
const STATUS_COLOR = { completed:'badge-green','in-progress':'badge-blue',planning:'badge-amber',created:'badge-gray',failed:'badge-red' };
const SCOPE_OPTS = ['full-infrastructure','partial','application'];
const TYPE_OPTS  = ['cloud-readiness','migration-readiness'];

export default function Assessments() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name:'', description:'', scope:'full-infrastructure', assessment_type:'cloud-readiness' });

  const load = () => {
    setLoading(true);
    getAssessments(ORG).then(r => setItems(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const filtered = items.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createAssessment({ ...form, organization_id: ORG });
      setModal(false);
      setForm({ name:'', description:'', scope:'full-infrastructure', assessment_type:'cloud-readiness' });
      load();
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Assessments</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#475569' }}>Cloud readiness evaluations for your organization</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}><Plus size={14}/> New Assessment</button>
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:20 }}>
        <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
        <input placeholder="Search assessments…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:34 }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#475569' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No assessments found" sub="Create your first cloud readiness assessment to get started."
          action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/> New Assessment</button>} />
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {filtered.map(a => (
            <Link key={a.id} to={`/assessments/${a.id}`} style={{ textDecoration:'none' }}>
              <div className="card" style={{ padding:18, display:'flex', alignItems:'center', gap:16, transition:'border-color .15s', cursor:'pointer' }}
                   onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}
                   onMouseLeave={e=>e.currentTarget.style.borderColor='#1e2d45'}>
                <div style={{ width:44, height:44, borderRadius:10, background:'#0a1628', border:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <ClipboardList size={20} color="#60a5fa" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e2e8f0' }}>{a.name}</div>
                  <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{a.assessment_type} · {a.scope} · {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                  {a.scores?.overall_score != null && (
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:20, fontWeight:800, color: a.scores.overall_score>=70?'#34d399':a.scores.overall_score>=50?'#fbbf24':'#f87171' }}>{a.scores.overall_score}%</div>
                      <div style={{ fontSize:10, color:'#475569' }}>Overall</div>
                    </div>
                  )}
                  <span className={`badge ${STATUS_COLOR[a.status]||'badge-gray'}`}>{a.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Assessment" onClose={()=>setModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label>Assessment Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Q3 Cloud Readiness" /></div>
            <div><label>Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Optional description…" style={{resize:'vertical'}} /></div>
            <div><label>Scope</label>
              <select value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))}>
                {SCOPE_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label>Type</label>
              <select value={form.assessment_type} onChange={e=>setForm(f=>({...f,assessment_type:e.target.value}))}>
                {TYPE_OPTS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
              <button className="btn-outline" onClick={()=>setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={submit} disabled={saving||!form.name.trim()}>{saving?'Creating…':'Create Assessment'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
