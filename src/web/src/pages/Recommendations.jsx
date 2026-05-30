import { useState, useEffect } from 'react';
import { getAssessments, getRecommendations } from '../api/client';
import { Lightbulb, ChevronDown } from 'lucide-react';
import ScoreBar from '../components/ScoreBar';

const ORG = 'org-001';

export default function Recommendations() {
  const [assessments, setAssessments] = useState([]);
  const [selected,    setSelected]    = useState('');
  const [recs,        setRecs]        = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    getAssessments(ORG).then(r => {
      const completed = r.data.filter(a => a.status === 'completed');
      setAssessments(completed);
      if (completed.length > 0) { setSelected(completed[0].id); }
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getRecommendations(selected).then(r => setRecs(r.data.recommendations || [])).catch(()=>setRecs([])).finally(()=>setLoading(false));
  }, [selected]);

  const scoreColor = s => s>=80?'#34d399':s>=60?'#60a5fa':s>=40?'#fbbf24':'#f87171';

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Architecture Recommendations</h1>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#475569' }}>AI-scored architecture options generated from your assessments</p>
      </div>

      {/* Assessment selector */}
      <div style={{ marginBottom:24, maxWidth:400 }}>
        <label>Select Assessment</label>
        <div style={{ position:'relative' }}>
          <select value={selected} onChange={e=>setSelected(e.target.value)} style={{ paddingRight:36 }}>
            {assessments.length===0 && <option value="">No completed assessments</option>}
            {assessments.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#475569', pointerEvents:'none' }} />
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60, color:'#475569' }}>Loading recommendations…</div>
      : assessments.length===0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40, opacity:.2, marginBottom:12 }}>💡</div>
          <div style={{ fontSize:14, color:'#334155', fontWeight:600 }}>No completed assessments</div>
          <div style={{ fontSize:12, color:'#1e2d45', marginTop:4 }}>Run an assessment wizard to generate architecture recommendations</div>
        </div>
      ) : recs.length===0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:40, opacity:.2, marginBottom:12 }}>📊</div>
          <div style={{ fontSize:14, color:'#334155', fontWeight:600 }}>No recommendations yet</div>
          <div style={{ fontSize:12, color:'#1e2d45', marginTop:4 }}>Complete the assessment wizard — it auto-generates architecture recommendations</div>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {[...recs].sort((a,b)=>(b.suitability_score||0)-(a.suitability_score||0)).map(r=>(
            <div key={r.id} className="card" style={{ padding:22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:9, background:'#0a1628', border:'1px solid #1e3a5f', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Lightbulb size={18} color="#fbbf24" />
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{r.architecture_type}</div>
                    <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>Target: <span style={{ color:'#94a3b8', fontWeight:600 }}>{r.target_platform}</span></div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:28, fontWeight:900, color:scoreColor(r.suitability_score||0) }}>{r.suitability_score||0}%</div>
                  <div style={{ fontSize:10, color:'#475569' }}>Suitability</div>
                </div>
              </div>

              <ScoreBar label="Suitability Score" score={r.suitability_score} />

              {r.justification && <p style={{ fontSize:12, color:'#94a3b8', margin:'12px 0', lineHeight:1.6 }}>{r.justification}</p>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
                {r.pros?.length>0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>✓ Pros</div>
                    {r.pros.map((p,i)=><div key={i} style={{ fontSize:12, color:'#86efac', marginBottom:4, paddingLeft:8, borderLeft:'2px solid #14532d' }}>{p}</div>)}
                  </div>
                )}
                {r.cons?.length>0 && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:'#f87171', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>✗ Cons</div>
                    {r.cons.map((c,i)=><div key={i} style={{ fontSize:12, color:'#fca5a5', marginBottom:4, paddingLeft:8, borderLeft:'2px solid #7f1d1d' }}>{c}</div>)}
                  </div>
                )}
              </div>

              {(r.cost_estimate || r.implementation_effort_weeks) && (
                <div style={{ display:'flex', gap:16, marginTop:14, paddingTop:14, borderTop:'1px solid #1e2d45' }}>
                  {r.cost_estimate && <div style={{ fontSize:11, color:'#475569' }}>💰 Estimated cost: <span style={{ color:'#94a3b8', fontWeight:600 }}>${r.cost_estimate?.toLocaleString()}</span></div>}
                  {r.implementation_effort_weeks && <div style={{ fontSize:11, color:'#475569' }}>⏱ Effort: <span style={{ color:'#94a3b8', fontWeight:600 }}>{r.implementation_effort_weeks} weeks</span></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
