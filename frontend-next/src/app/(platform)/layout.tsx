import type { ReactNode } from 'react';
import { PlatformShell } from '@/layouts/PlatformShell';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
