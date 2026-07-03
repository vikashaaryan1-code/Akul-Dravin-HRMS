import { Metadata } from 'next';
import { TalentUniverse } from '@/components/recruitment/TalentUniverse';

export const metadata: Metadata = {
 title: 'AI Talent Universe | Recruitment',
};

export default function RecruitmentPage() {
 return <TalentUniverse />;
}
