export default function ScoreBar({ label, score, color }) {
  const c = score >= 80 ? '#34d399' : score >= 60 ? '#60a5fa' : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
        <span style={{ color:'#94a3b8' }}>{label}</span>
        <span style={{ color: color || c, fontWeight:700 }}>{score ?? 'N/A'}{score != null ? '%' : ''}</span>
      </div>
      <div style={{ height:6, background:'#0d1424', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score || 0}%`, background: color || c, borderRadius:3, transition:'width .5s ease' }} />
      </div>
    </div>
  );
}
