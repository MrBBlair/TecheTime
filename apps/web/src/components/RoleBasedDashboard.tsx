/**
 * RoleBasedDashboard - Routes users to the appropriate dashboard based on their role
 */

import { useAuth } from '../contexts/AuthContext';
import { Dashboard } from '../pages/Dashboard';
import { ClientAdminDashboard } from '../pages/ClientAdminDashboard';
import { ManagerDashboard } from '../pages/ManagerDashboard';
import { WorkerDashboard } from '../pages/WorkerDashboard';

export function RoleBasedDashboard() {
  const { userData } = useAuth();

  if (!userData) {
    return null;
  }

  switch (userData.role) {
    case 'CLIENT_ADMIN':
      return <ClientAdminDashboard />;
    case 'OWNER':
    case 'SUPERADMIN':
      return <Dashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'WORKER':
      return <WorkerDashboard />;
    default:
      return <Dashboard />;
  }
}
