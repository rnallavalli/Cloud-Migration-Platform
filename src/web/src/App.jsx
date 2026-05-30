import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Recommendations from './pages/Recommendations';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, overflowY:'auto', background:'#0a0f1e' }}>
          <Routes>
            <Route path="/"                       element={<Dashboard />} />
            <Route path="/assessments"            element={<Assessments />} />
            <Route path="/assessments/:id"        element={<AssessmentDetail />} />
            <Route path="/projects"               element={<Projects />} />
            <Route path="/projects/:id"           element={<ProjectDetail />} />
            <Route path="/recommendations"        element={<Recommendations />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
