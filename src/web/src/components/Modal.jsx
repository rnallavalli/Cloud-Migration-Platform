export default function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:12, width, maxWidth:'95vw', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,.8)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #1e2d45', flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#e2e8f0' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:20, overflowY:'auto', flex:1 }}>{children}</div>
      </div>
    </div>
  );
}
