import { redirect } from 'next/navigation';

export default function EmployerDashboardLegacyRedirect() {
  redirect('/company/dashboard');
}
