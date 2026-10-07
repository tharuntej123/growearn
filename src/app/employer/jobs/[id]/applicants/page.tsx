import { redirect } from 'next/navigation';

export default async function EmployerJobApplicantsLegacyRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/company/jobs/${id}/applicants`);
}
