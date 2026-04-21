import type { ReactNode } from 'react';
import { PlatformShell } from '@/layouts/PlatformShell';
import ProtectedLayout from '@/layouts/ProtectedLayout';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <PlatformShell>{children}</PlatformShell>
    </ProtectedLayout>
  );
}
