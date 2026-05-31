import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, FolderKanban, Lightbulb, Activity, Cloud, Map } from 'lucide-react';

const links = [
  { to:'/',              icon:LayoutDashboard, label:'Dashboard' },
  { to:'/assessments',  icon:ClipboardList,   label:'Assessments' },
  { to:'/projects',     icon:FolderKanban,    label:'Projects' },
  { to:'/recommendations', icon:Lightbulb,   label:'Recommendations' },
  { to:'/planner',      icon:Map,             label:'Migration Planner', highlight: true },
];

export default function Sidebar() {
  return (
    <aside style={{ width:220, background:'#070d1a', borderRight:'1px solid #1e2d45', display:'flex', flexDirection:'column', flexShrink:0, height:'100vh', position:'sticky', top:0 }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #1e2d45' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Cloud size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#e2e8f0', lineHeight:1.2 }}>Cloud Migration</div>
            <div style={{ fontSize:10, color:'#475569', fontWeight:500 }}>Platform</div>
          </div>
        </div>
      </div>

      {/* Org badge */}
      <div style={{ padding:'10px 14px' }}>
        <div style={{ background:'#0d1424', border:'1px solid #1e2d45', borderRadius:7, padding:'8px 10px' }}>
          <div style={{ fontSize:10, color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:.6 }}>Organization</div>
          <div style={{ fontSize:12, color:'#60a5fa', fontWeight:600, marginTop:2 }}>org-001</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'4px 8px' }}>
        {links.map(({ to, icon:Icon, label, highlight }) => (
          <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
            borderRadius:7, marginBottom:2, textDecoration:'none', fontSize:13, fontWeight:500,
            color: isActive ? '#60a5fa' : highlight ? '#c084fc' : '#64748b',
            background: isActive ? '#0d1d3a' : highlight ? '#1a0d2e' : 'transparent',
            borderLeft: isActive ? '2px solid #3b82f6' : highlight ? '2px solid #7c3aed40' : '2px solid transparent',
            transition:'all .12s',
          })}>
            <Icon size={15} /> {label}
            {highlight && <span style={{ marginLeft:'auto', fontSize:9, background:'#7c3aed', color:'#fff', padding:'1px 5px', borderRadius:8, fontWeight:700 }}>NEW</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid #1e2d45' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#475569' }}>
          <Activity size={11} color="#34d399" />
          <span>API connected</span>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', marginLeft:'auto' }} />
        </div>
      </div>
    </aside>
  );
}
