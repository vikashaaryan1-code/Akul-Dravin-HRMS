import { redirect } from 'next/navigation';

export default function CareersPage() {
  redirect('/job-marketplace?as=job-seeker');
}
