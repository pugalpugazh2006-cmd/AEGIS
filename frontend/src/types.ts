export type Service = {
  id: number;
  name: string;
  description: string;
  is_healthy: number;
};

export type Incident = {
  id: number;
  title: string;
  severity: string;
  status: string;
  start_time: string;
  resolved_time?: string | null;
  service_id?: number;
};

export type RootCause = {
  id: number;
  incident_id: number;
  service_id: number;
  confidence_score: number;
  evidence: string;
  created_at: string;
};

export type Repair = {
  id: number;
  incident_id: number;
  root_cause_id: number;
  action_type: string;
  status: string;
  created_at: string;
};

export type ValidationResult = {
  id: number;
  repair_id: number;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
  baseline_metrics: any;
  post_fix_metrics: any;
  created_at: string;
};
