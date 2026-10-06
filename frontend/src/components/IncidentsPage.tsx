import { useOutletContext } from 'react-router-dom';
import IncidentCommandCenter from './incidents/IncidentCommandCenter';
import { DashboardContextType } from './DashboardLayout';

export default function IncidentsPage() {
  const { incidents } = useOutletContext<DashboardContextType>();

  return (
    <div className="h-full flex flex-col space-y-4">
      <IncidentCommandCenter incidents={incidents} />
    </div>
  );
}
