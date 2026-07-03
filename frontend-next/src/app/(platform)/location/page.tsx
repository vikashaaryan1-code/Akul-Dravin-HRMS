import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Location Tracking � AKUL DRAVIN',
 description: 'Real-time employee location intelligence: geo-fenced check-in, field force tracking and location-based attendance.',
};

import { LocationModuleView } from '@/components/modules/LocationModuleView';

export default function LocationPage() {
 return <LocationModuleView />;
}
