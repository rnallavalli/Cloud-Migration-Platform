import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Cloud, CheckCircle, AlertCircle, Loader, FileSpreadsheet, ArrowRight } from 'lucide-react';

const PROVIDERS = [
  { value:'aws',   label:'Amazon Web Services', color:'#ff9900', logo:'☁', desc:'EC2 · RDS · S3 · EKS · Lambda' },
  { value:'azure', label:'Microsoft Azure',      color:'#0078d4', logo:'⬡', desc:'VMs · SQL · Blob · AKS · Functions' },
  { value:'gcp',   label:'Google Cloud',         color:'#4285f4', logo:'◉', desc:'GCE · Cloud SQL · GCS · GKE · Run' },
];

export default function MigrationPlanner() {
  const nav = useNavigate();
  const [provider,     setProvider]     = useState('aws');
  const [projectName,  setProjectName]  = useState('');
  const [file,         setFile]         = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const [status,       setStatus]       = useState('idle'); // idle | uploading | done | error
  const [error,        setError]        = useState('');
  const [warnings,     setWarnings]     = useState([]);
  const [planId,       setPlanId]       = useState(null);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus('uploading'); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('provider', provider);
    fd.append('project_name', projectName || file.name.replace(/\.[^.]+$/, ''));
    try {
      const res = await fetch('/api/v1/planner/upload', { method:'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setWarnings(data.warnings || []);
      setPlanId(data.plan_id);
      setStatus('done');
    } catch(e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const downloadTemplate = () => {
    window.open('/api/v1/planner/template', '_blank');
  };

  return (
    <div style={{ padding:28, maxWidth:860, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Cloud size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Migration Planner</h1>
            <p style={{ margin:0, fontSize:13, color:'#475569' }}>Upload your infrastructure inventory → get a full end-to-end migration plan</p>
          </div>
        </div>
      </div>

      {/* Step 1 — Provider */}
      <StepCard number="1" title="Choose Target Cloud Provider">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {PROVIDERS.map(p => (
            <button key={p.value} onClick={() => setProvider(p.value)} style={{
              padding:'16px 14px', borderRadius:10, border:`2px solid ${provider===p.value ? p.color : '#1e2d45'}`,
              background: provider===p.value ? `${p.color}15` : '#070d1a',
              cursor:'pointer', textAlign:'left', transition:'all .15s',
            }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{p.logo}</div>
              <div style={{ fontSize:13, fontWeight:700, color: provider===p.value ? p.color : '#94a3b8' }}>{p.label}</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>{p.desc}</div>
              {provider===p.value && <div style={{ marginTop:8, fontSize:10, color:p.color, fontWeight:700 }}>✓ Selected</div>}
            </button>
          ))}
        </div>
      </StepCard>

      {/* Step 2 — Project name */}
      <StepCard number="2" title="Project Name">
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="e.g. DC Migration 2025 Phase 1"
          style={{ background:'#070d1a', border:'1px solid #1e2d45', borderRadius:8, color:'#e2e8f0', padding:'10px 14px', fontSize:14, width:'100%', outline:'none' }}
        />
      </StepCard>

      {/* Step 3 — Upload */}
      <StepCard number="3" title="Upload Infrastructure Inventory">
        <div style={{ marginBottom:14 }}>
          <button onClick={downloadTemplate} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
            background:'none', border:'1px solid #1e2d45', borderRadius:7,
            color:'#60a5fa', cursor:'pointer', fontSize:12, fontWeight:600,
          }}>
            <Download size={13}/> Download CSV Template
          </button>
          <span style={{ fontSize:11, color:'#475569', marginLeft:12 }}>
            Fill in your assets then upload below. Supports .csv · .xlsx · .xls
          </span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
          style={{
            border:`2px dashed ${dragOver ? '#60a5fa' : file ? '#34d399' : '#1e2d45'}`,
            borderRadius:10, padding:'36px 20px', textAlign:'center', cursor:'pointer',
            background: dragOver ? '#0d1d3a' : file ? '#022c22' : '#070d1a',
            transition:'all .15s',
          }}
        >
          {file ? (
            <div>
              <FileSpreadsheet size={36} color="#34d399" style={{ marginBottom:10 }} />
              <div style={{ fontSize:14, color:'#34d399', fontWeight:700 }}>{file.name}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:4 }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </div>
            </div>
          ) : (
            <div>
              <Upload size={36} color="#475569" style={{ marginBottom:10 }} />
              <div style={{ fontSize:14, color:'#64748b', fontWeight:600 }}>Drag & drop your file here</div>
              <div style={{ fontSize:12, color:'#374151', marginTop:4 }}>or click to browse</div>
              <div style={{ fontSize:11, color:'#1e2d45', marginTop:8 }}>CSV · XLSX · XLS</div>
            </div>
          )}
          <input id="file-input" type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }}
            onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
        </div>

        {/* What the planner covers */}
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
          {[
            ['🏗️','Architecture','Current → target service mapping'],
            ['💰','Cost Analysis','Monthly cloud costs + ROI'],
            ['🔐','Security','Per-asset security checklist'],
            ['📦','Deployment','Step-by-step cutover guide'],
            ['🌊','Wave Planning','Phased migration schedule'],
            ['📊','Visualization','Charts, Gantt, breakdown'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ background:'#0a0f1e', border:'1px solid #1e2d45', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>{title}</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{desc}</div>
            </div>
          ))}
        </div>
      </StepCard>

      {/* Errors / Warnings */}
      {error && (
        <div style={{ background:'#1a0505', border:'1px solid #7f1d1d', borderRadius:8, padding:'12px 16px', marginBottom:16, display:'flex', gap:10 }}>
          <AlertCircle size={16} color="#f87171" style={{ flexShrink:0, marginTop:1 }} />
          <span style={{ fontSize:13, color:'#fca5a5' }}>{error}</span>
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{ background:'#1c1004', border:'1px solid #78350f', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:6 }}>⚠ Warnings</div>
          {warnings.map((w,i) => <div key={i} style={{ fontSize:12, color:'#fde68a' }}>· {w}</div>)}
        </div>
      )}

      {/* Analyze button */}
      {status !== 'done' && (
        <button
          onClick={handleAnalyze}
          disabled={!file || status === 'uploading'}
          style={{
            width:'100%', padding:'14px', marginTop:8,
            background: file ? 'linear-gradient(135deg,#1d4ed8,#4f46e5)' : '#1a1f2e',
            border:'none', borderRadius:10, color: file ? '#fff' : '#374151',
            fontSize:15, fontWeight:700, cursor: file ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow: file ? '0 4px 20px rgba(29,78,216,.4)' : 'none',
          }}
        >
          {status === 'uploading'
            ? <><Loader size={18} style={{ animation:'spin 1s linear infinite' }}/> Analysing infrastructure…</>
            : <><Cloud size={18}/> Generate Migration Plan <ArrowRight size={16}/></>
          }
        </button>
      )}

      {/* Done */}
      {status === 'done' && planId && (
        <div style={{ background:'#022c22', border:'1px solid #14532d', borderRadius:10, padding:'20px 24px', marginTop:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <CheckCircle size={28} color="#34d399" />
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#86efac' }}>Migration Plan Ready!</div>
              {warnings.length > 0 && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{warnings.length} minor warning{warnings.length>1?'s':''}</div>}
            </div>
          </div>
          <button
            onClick={() => nav(`/planner/${planId}`)}
            style={{ padding:'10px 24px', background:'linear-gradient(135deg,#15803d,#059669)', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}
          >
            View Full Plan <ArrowRight size={16}/>
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StepCard({ number, title, children }) {
  return (
    <div className="card" style={{ padding:20, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{number}</div>
        <span style={{ fontSize:14, fontWeight:700, color:'#e2e8f0' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
