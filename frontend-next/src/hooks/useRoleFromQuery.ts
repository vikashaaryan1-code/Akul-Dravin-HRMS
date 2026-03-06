'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { isPlatformRole, toSafePlatformRole } from '@/utils/platform-config';

export const useRoleFromQuery = () => {
  const activeRole = useUIStore((state) => state.activeRole);
  const setActiveRole = useUIStore((state) => state.setActiveRole);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');

    if (role && isPlatformRole(role)) {
      if (role !== activeRole) {
        setActiveRole(role);
      }
      return;
    }

    const safeRole = toSafePlatformRole(activeRole);
    if (safeRole !== activeRole) {
      setActiveRole(safeRole);
    }
  }, [activeRole, setActiveRole]);
};
