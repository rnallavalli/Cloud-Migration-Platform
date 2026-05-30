export default function StatCard({ label, value, sub, icon: Icon, color = '#60a5fa', trend }) {
  return (
    <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:.7 }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1.1, marginTop:4 }}>{value ?? '—'}</div>
          {sub && <div style={{ fontSize:11, color:'#374151', marginTop:4 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width:38, height:38, borderRadius:9, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ fontSize:11, color: trend >= 0 ? '#34d399' : '#f87171' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}
