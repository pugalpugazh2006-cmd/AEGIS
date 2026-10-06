import { useOutletContext } from 'react-router-dom';
import Hero from './dashboard/Hero';
import KPICards from './dashboard/KPICards';
import IntelligencePipeline from './ui/IntelligencePipeline';
import TopologyView from './topology/TopologyView';
import FaultInjectionLab from './experiments/FaultInjectionLab';
import IncidentCommandCenter from './incidents/IncidentCommandCenter';
import { DashboardContextType } from './DashboardLayout';

export default function OverviewPage() {
  const { topology, services, incidents, loadDashboardData } = useOutletContext<DashboardContextType>();

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE');
  const criticalIncidents = activeIncidents.filter(i => i.severity === 'CRITICAL');
  const anomalousServices = services.filter(s => s.is_healthy === 0);

  const hasTelemetry = services.length > 0;
  const hasAnomaly = anomalousServices.length > 0;
  const hasIncident = activeIncidents.length > 0;
  const hasRCA = hasIncident; 
  const hasValidation = incidents.some(i => i.status === 'RESOLVED');
  const hasRecovery = incidents.some(i => i.status === 'RESOLVED');

  return (
    <>
      <Hero servicesCount={services.length} criticalCount={criticalIncidents.length} />
      
      <KPICards 
        servicesCount={services.length}
        anomalousCount={anomalousServices.length}
        activeIncidentsCount={activeIncidents.length}
        criticalIncidentsCount={criticalIncidents.length}
      />

      <IntelligencePipeline 
        hasTelemetry={hasTelemetry}
        hasAnomaly={hasAnomaly}
        hasIncident={hasIncident}
        hasRCA={hasRCA}
        hasValidation={hasValidation}
        hasRecovery={hasRecovery}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2">
          <TopologyView elements={topology} />
        </div>
        <div className="xl:col-span-1">
          <FaultInjectionLab onExperimentStart={() => setTimeout(loadDashboardData, 1000)} />
        </div>
      </div>

      <div className="mt-8">
        <IncidentCommandCenter incidents={incidents} />
      </div>
    </>
  );
}
