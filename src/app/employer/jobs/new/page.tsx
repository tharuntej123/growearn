import { redirect } from 'next/navigation';

export default function EmployerNewJobLegacyRedirect() {
  redirect('/company/jobs/new');
}
