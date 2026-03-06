import { notFound, redirect } from 'next/navigation';
import { isPlatformRole } from '@/utils/platform-config';

type DashboardRolePageProps = {
  params: Promise<{ role: string }>;
};

export default async function DashboardRolePage({ params }: DashboardRolePageProps) {
  const { role } = await params;

  if (!isPlatformRole(role)) {
    notFound();
  }

  redirect(`/dashboard?role=${role}`);
}
