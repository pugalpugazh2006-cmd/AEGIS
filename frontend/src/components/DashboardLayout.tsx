import { useEffect, useState, useCallback } from 'react';
import Layout from './layout/Layout';

import { Outlet } from 'react-router-dom';
import { Service, Incident } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export type DashboardContextType = {
  topology: any;
  services: Service[];
  incidents: Incident[];
  loadDashboardData: () => Promise<void>;
};

export default function DashboardLayout() {
  const [topology, setTopology] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  
  const loadDashboardData = useCallback(async () => {
    try {
      const [topologyRes, servicesRes, incidentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/topology`),
        fetch(`${API_BASE_URL}/services`),
        fetch(`${API_BASE_URL}/incidents`),
      ]);

      if (topologyRes.ok) setTopology(await topologyRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (incidentsRes.ok) setIncidents(await incidentsRes.json());
    } catch (err) {
      console.error('Dashboard loading error:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);



  return (
    <Layout incidents={incidents}>
      <Outlet context={{ topology, services, incidents, loadDashboardData } satisfies DashboardContextType} />
    </Layout>
  );
}