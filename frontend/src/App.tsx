import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import OverviewPage from './components/OverviewPage';
import InfrastructurePage from './components/InfrastructurePage';
import TopologyPage from './components/TopologyPage';
import IncidentsPage from './components/IncidentsPage';
import ExperimentsPage from './components/ExperimentsPage';
import RepairsPage from './components/RepairsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="infrastructure" element={<InfrastructurePage />} />
          <Route path="topology" element={<TopologyPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="experiments" element={<ExperimentsPage />} />
          <Route path="repairs" element={<RepairsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
