export default function EmptyState({ icon, title, sub, action }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', gap:12, textAlign:'center' }}>
      <div style={{ fontSize:48, opacity:.2 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'#334155' }}>{title}</div>
      {sub && <div style={{ fontSize:12, color:'#1e2d45' }}>{sub}</div>}
      {action && <div style={{ marginTop:8 }}>{action}</div>}
    </div>
  );
}
