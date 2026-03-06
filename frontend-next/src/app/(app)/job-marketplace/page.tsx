import { redirect } from 'next/navigation';

type JobMarketplacePageProps = {
  searchParams: Promise<{ role?: string; as?: string }>;
};

export default async function JobMarketplacePage({ searchParams }: JobMarketplacePageProps) {
  const params = await searchParams;

  if (params.role) {
    redirect(`/marketplace?role=${encodeURIComponent(params.role)}`);
  }

  if (params.as === 'job-seeker') {
    redirect('/marketplace?role=guest');
  }

  const role = params.as ?? 'recruiter';
  redirect(`/marketplace?role=${encodeURIComponent(role)}`);
}
