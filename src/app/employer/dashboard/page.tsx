'use client';

/**
 * Legacy Employer Dashboard Compatibility Route.
 * Canonical route is /company/dashboard.
 */
import CompanyDashboardPage from '@/app/company/dashboard/page';

export default function EmployerDashboardLegacyRedirect() {
  return <CompanyDashboardPage />;
}
