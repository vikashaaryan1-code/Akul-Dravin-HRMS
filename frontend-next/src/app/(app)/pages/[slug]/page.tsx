import { redirect } from 'next/navigation';

type LegacyContentPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyContentPage({ params }: LegacyContentPageProps) {
  await params;
  redirect('/#features');
}
