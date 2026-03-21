import { useEffect, useState } from 'react';

type Permission = {
  role: string;
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function useDynamicPermissions(role: string) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const authState = localStorage.getItem('akul-dravin-auth-state');
        const token = authState ? JSON.parse(authState).state?.accessToken : null;
        
        if (!token) {
          console.log('No token found, skipping permission fetch');
          setLoading(false);
          return;
        }

        console.log(`Fetching permissions for role: ${role}`);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feature-permissions/role/${role}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log(`Fetch response status: ${res.status}`);
        
        if (res.ok) {
          const data = await res.json();
          console.log(`Permissions fetched for role "${role}":`, data);
          setPermissions(Array.isArray(data) ? data : []);
        } else {
          console.error(`Failed to fetch permissions, status: ${res.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [role]);

  const canViewFeature = (feature: string) => {
    const perm = permissions.find(p => p.feature.toLowerCase() === feature.toLowerCase());
    console.log(`Checking permission for "${feature}":`, perm);
    // Allow if ANY permission is granted (View, Edit, or Delete)
    return perm ? (perm.canView || perm.canEdit || perm.canDelete) : false;
  };

  return { permissions, loading, canViewFeature };
}
