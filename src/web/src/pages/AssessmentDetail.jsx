import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle } from 'lucide-react';
import { getAssessment, updateAssessment, createRecommendation } from '../api/client';
import ScoreBar from '../components/ScoreBar';

const WIZARD_STEPS = [
  {
    key:'business', title:'Business Readiness',
    fields:[
      {k:'has_executive_sponsor',       label:'Executive sponsor in place?',         type:'bool'},
      {k:'clear_business_objectives',   label:'Clear business objectives defined?',  type:'bool'},
      {k:'budget_allocated',            label:'Budget allocated?',                   type:'bool'},
      {k:'budget_approved',             label:'Budget formally approved?',           type:'bool'},
      {k:'resources_committed',         label:'Team resources committed?',           type:'bool'},
      {k:'realistic_timeline',          label:'Realistic timeline established?',     type:'bool'},
    ],
  },
  {
    key:'technical', title:'Technical Readiness',
    fields:[
      {k:'application_complexity',      label:'Application architecture type',       type:'select', opts:['microservices','monolithic','unknown']},
      {k:'has_cloud_ready_infrastructure', label:'Cloud-ready infrastructure?',      type:'bool'},
      {k:'integration_count',           label:'Number of integrations',              type:'number'},
      {k:'data_size_tb',                label:'Total data size (TB)',                type:'number'},
      {k:'has_legacy_systems',          label:'Legacy systems present?',             type:'bool'},
    ],
  },
  {
    key:'organizational', title:'Organizational Readiness',
    fields:[
      {k:'team_cloud_skills_level',     label:'Team cloud skills level',             type:'select', opts:['none','basic','intermediate','advanced']},
      {k:'training_plan_exists',        label:'Training plan exists?',              type:'bool'},
      {k:'change_management_plan_exists', label:'Change management plan?',          type:'bool'},
      {k:'vendor_partnerships_established', label:'Cloud vendor partnerships?',     type:'bool'},
      {k:'governance_framework_exists', label:'Cloud governance framework?',        type:'bool'},
    ],
  },
  {
    key:'security', title:'Security & Compliance',
    fields:[
      {k:'compliance_requirements_documented', label:'Compliance requirements documented?', type:'bool'},
      {k:'security_policies_in_place',  label:'Security policies established?',     type:'bool'},
      {k:'data_privacy_framework_exists', label:'Data privacy framework?',          type:'bool'},
      {k:'encryption_standards_defined', label:'Encryption standards defined?',     type:'bool'},
      {k:'audit_logging_capability',    label:'Centralised audit logging?',         type:'bool'},
    ],
  },
];

function initAnswers() {
  return Object.fromEntries(WIZARD_STEPS.map(s => [s.key, Object.fromEntries(s.fields.map(f => [f.k, f.type==='bool' ? false : f.type==='number' ? 0 : f.opts?.[0] ?? '']))]));
}

const STATUS_COLOR = { completed:'badge-green','in-progress':'badge-blue',created:'badge-gray',failed:'badge-red' };

export default function AssessmentDetail() {
  const { id } = useParams();
  const [data,      setData]     = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [wizStep,   setWizStep]  = useState(null); // null = detail view, 0-3 = wizard step
  const [answers,   setAnswers]  = useState(initAnswers());
  const [running,   setRunning]  = useState(false);

  const load = () => { setLoading(true); getAssessment(id).then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load,[id]);

  const setField = (section, key, val) => setAnswers(a => ({ ...a, [section]: { ...a[section], [key]: val } }));

  const runAssessment = async () => {
    setRunning(true);
    try {
      // Call our local engine via a simple scoring simulation matching the Python engine exactly
      const engine = localEngine(answers);
      await updateAssessment(id, {
        status: 'completed',
        business_readiness_score:       engine.business,
        technical_readiness_score:      engine.technical,
        organizational_readiness_score: engine.org,
        security_compliance_score:      engine.security,
        recommendations: engine.recommendations,
        risks: engine.risks,
      });
      // Auto-create architecture recommendations
      const archs = autoRecommend(answers.technical);
      for (const rec of archs) await createRecommendation({ assessment_id: id, ...rec }).catch(()=>{});
      setWizStep(null);
      load();
    } catch(e) { alert(e.message); }
    finally { setRunning(false); }
  };

  if (loading) return <div style={{ padding:28, color:'#475569' }}>Loading…</div>;
  if (!data)   return <div style={{ padding:28, color:'#f87171' }}>Assessment not found.</div>;

  // ── Wizard ───────────────────────────────────────────────────────────────────
  if (wizStep !== null) {
    const step = WIZARD_STEPS[wizStep];
    return (
      <div style={{ padding:28, maxWidth:680 }}>
        <button className="btn-outline" style={{ marginBottom:20 }} onClick={()=>setWizStep(null)}><ArrowLeft size={13}/> Back</button>
        {/* Progress */}
        <div style={{ display:'flex', gap:6, marginBottom:24 }}>
          {WIZARD_STEPS.map((s,i)=>(
            <div key={s.key} style={{ flex:1, height:4, borderRadius:2, background: i<=wizStep?'#3b82f6':'#1e2d45', transition:'background .3s' }} />
          ))}
        </div>
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700, color:'#e2e8f0' }}>Step {wizStep+1} of 4 — {step.title}</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {step.fields.map(f => (
              <div key={f.k}>
                <label>{f.label}</label>
                {f.type==='bool' && (
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    {[true,false].map(v=>(
                      <button key={String(v)} onClick={()=>setField(step.key,f.k,v)}
                        style={{ padding:'7px 20px', borderRadius:7, border:`1px solid ${answers[step.key][f.k]===v?'#3b82f6':'#1e2d45'}`, background: answers[step.key][f.k]===v?'#0d1d3a':'transparent', color: answers[step.key][f.k]===v?'#60a5fa':'#64748b', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        {v?'Yes':'No'}
                      </button>
                    ))}
                  </div>
                )}
                {f.type==='number' && (
                  <input type="number" min={0} value={answers[step.key][f.k]} onChange={e=>setField(step.key,f.k,parseFloat(e.target.value)||0)} style={{ marginTop:4 }} />
                )}
                {f.type==='select' && (
                  <select value={answers[step.key][f.k]} onChange={e=>setField(step.key,f.k,e.target.value)} style={{ marginTop:4 }}>
                    {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
            <button className="btn-outline" onClick={()=>setWizStep(w=>Math.max(0,w-1))} disabled={wizStep===0}><ArrowLeft size={13}/> Previous</button>
            {wizStep < 3
              ? <button className="btn-primary" onClick={()=>setWizStep(w=>w+1)}>Next →</button>
              : <button className="btn-primary" onClick={runAssessment} disabled={running}><CheckCircle size={13}/> {running?'Running…':'Complete Assessment'}</button>
            }
          </div>
        </div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────────
  const s = data.scores || {};
  return (
    <div style={{ padding:28 }}>
      <Link to="/assessments" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#475569', textDecoration:'none', fontSize:13, marginBottom:20 }}>
        <ArrowLeft size={13}/> All Assessments
      </Link>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>{data.name}</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <span className={`badge ${STATUS_COLOR[data.status]||'badge-gray'}`}>{data.status}</span>
            <span className="badge badge-gray">{data.assessment_type}</span>
            <span className="badge badge-gray">{data.scope}</span>
          </div>
        </div>
        {data.status !== 'completed' && (
          <button className="btn-primary" onClick={()=>{ setAnswers(initAnswers()); setWizStep(0); }}>
            <Play size={13}/> Run Assessment
          </button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* Scores */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:16 }}>Readiness Scores</div>
          {s.overall_score != null ? (
            <>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:52, fontWeight:900, color: s.overall_score>=70?'#34d399':s.overall_score>=50?'#fbbf24':'#f87171' }}>{s.overall_score}%</div>
                <div style={{ fontSize:12, color:'#475569' }}>Overall Readiness</div>
              </div>
              <ScoreBar label="Business Readiness"       score={s.business_readiness} />
              <ScoreBar label="Technical Readiness"      score={s.technical_readiness} />
              <ScoreBar label="Organizational Readiness" score={s.organizational_readiness} />
              <ScoreBar label="Security & Compliance"    score={s.security_compliance} />
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'30px 0', color:'#334155', fontSize:12 }}>
              Run the assessment wizard to generate scores
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Recommendations</div>
          {(data.recommendations||[]).length === 0 ? (
            <div style={{ fontSize:12, color:'#334155' }}>No recommendations yet — complete the assessment wizard.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.recommendations.slice(0,8).map((r,i)=>(
                <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:'#94a3b8', paddingBottom:8, borderBottom:'1px solid #0d1424' }}>
                  <span style={{ color:'#3b82f6', flexShrink:0 }}>→</span> {r}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risks */}
        {(data.risks||[]).length > 0 && (
          <div className="card" style={{ padding:20, gridColumn:'1/-1' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#94a3b8', marginBottom:14 }}>Identified Risks</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
              {data.risks.map((r,i)=>(
                <div key={i} style={{ background:'#120a0a', border:'1px solid #7f1d1d30', borderRadius:7, padding:'10px 12px', fontSize:12, color:'#fca5a5', display:'flex', gap:8 }}>
                  <span>⚠</span> {r}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Local scoring engine (mirrors src/assessment/engine.py) ──────────────────
function localEngine(answers) {
  const recs = [], risks = [];
  let b=0, t=0, o=0, s=0;
  const bus = answers.business;
  if (bus.has_executive_sponsor)   b+=25; else { recs.push('Secure executive sponsorship'); risks.push('Lack of executive support can lead to project failure'); }
  if (bus.clear_business_objectives) b+=20; else recs.push('Define clear business objectives');
  if (bus.budget_allocated&&bus.budget_approved) b+=20; else { recs.push('Allocate and approve budget'); risks.push('Budget constraints may delay migration'); }
  if (bus.resources_committed) b+=20; else recs.push('Commit resources for migration');
  if (bus.realistic_timeline)  b+=15; else recs.push('Create realistic migration timeline');

  const tech = answers.technical;
  if (tech.application_complexity==='microservices') t+=25;
  else if (tech.application_complexity==='monolithic') { t+=10; recs.push('Consider breaking down monolithic applications'); }
  else recs.push('Analyse and document application architecture');
  if (tech.has_cloud_ready_infrastructure) t+=25; else { recs.push('Update to cloud-ready infrastructure'); risks.push('Legacy infrastructure may hinder cloud adoption'); }
  const ic = tech.integration_count||0;
  if (ic<=5) t+=20; else if (ic<=15) { t+=10; recs.push(`Plan for ${ic} integrations`); } else risks.push(`High integration complexity (${ic})`);
  const ds = tech.data_size_tb||0;
  if (ds<=1) t+=20; else if (ds<=10) t+=12; else risks.push(`Large data volume (${ds}TB)`);
  if (!tech.has_legacy_systems) t+=10; else risks.push('Legacy system dependencies increase complexity');

  const org = answers.organizational;
  const skills = org.team_cloud_skills_level;
  if (skills==='advanced') o+=25; else if (skills==='intermediate') o+=18; else if (skills==='basic') { o+=10; recs.push('Provide cloud certification training'); } else { recs.push('Conduct comprehensive cloud training'); risks.push('Lack of cloud expertise may impact migration'); }
  if (org.training_plan_exists)           o+=20; else recs.push('Develop a training plan');
  if (org.change_management_plan_exists)  o+=20; else { recs.push('Create change management plan'); risks.push('Poor change management affects adoption'); }
  if (org.vendor_partnerships_established) o+=20; else recs.push('Establish cloud vendor partnerships');
  if (org.governance_framework_exists)    o+=15; else recs.push('Define cloud governance framework');

  const sec = answers.security;
  if (sec.compliance_requirements_documented) s+=20; else { recs.push('Document compliance requirements'); risks.push('Compliance gaps expose to legal issues'); }
  if (sec.security_policies_in_place)        s+=20; else { recs.push('Establish security policies'); risks.push('Missing policies increase breach risk'); }
  if (sec.data_privacy_framework_exists)     s+=20; else recs.push('Implement data privacy framework');
  if (sec.encryption_standards_defined)      s+=20; else { recs.push('Define encryption standards'); risks.push('Unencrypted data increases security risk'); }
  if (sec.audit_logging_capability)          s+=20; else recs.push('Establish centralised audit logging');

  return { business:Math.min(b,100), technical:Math.min(t,100), org:Math.min(o,100), security:Math.min(s,100), recommendations:[...new Set(recs)], risks:[...new Set(risks)] };
}

function autoRecommend(tech) {
  const complexity = tech.application_complexity;
  const recs = [];
  if (complexity==='microservices') {
    recs.push({ architecture_type:'microservices', target_platform:'kubernetes', suitability_score:92, justification:'Existing microservices align naturally with Kubernetes orchestration.', pros:['Auto-scaling','High availability','Independent deployments'], cons:['Operational complexity','Steep learning curve'] });
  } else if (complexity==='monolithic') {
    recs.push({ architecture_type:'monolith-first', target_platform:'vm', suitability_score:75, justification:'Lift-and-shift is fastest path for monolithic apps; refactor later.', pros:['Fast migration','Low risk'], cons:['No cloud-native benefits','Technical debt'] });
    recs.push({ architecture_type:'refactor', target_platform:'container', suitability_score:68, justification:'Containerise for portability before breaking into services.', pros:['Portability','Better resource use'], cons:['Refactoring effort required'] });
  } else {
    recs.push({ architecture_type:'serverless', target_platform:'lambda', suitability_score:72, justification:'Serverless reduces ops overhead for stateless workloads.', pros:['No server management','Pay per use'], cons:['Cold starts','Vendor lock-in'] });
  }
  return recs;
}
