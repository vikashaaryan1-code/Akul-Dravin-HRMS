import { redirect } from 'next/navigation';

type CandidateProfilePageProps = {
 searchParams: Promise<{ role?: string; as?: string }>;
};

export default async function CandidateProfilePage({ searchParams }: CandidateProfilePageProps) {
 const params = await searchParams;
 const role = params.role ?? (params.as === 'job-seeker' ? 'recruiter' : params.as ?? 'recruiter');
 redirect(`/recruitment?role=${encodeURIComponent(role)}`);
}
