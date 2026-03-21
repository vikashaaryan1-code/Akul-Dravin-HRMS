'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const FEATURES = [
  'Dashboard', 'Employees', 'Attendance', 'Tracking', 'Tasks', 'Payroll', 
  'Performance', 'Location', 'Recruitment', 'CRM', 'Sales', 'Marketing', 
  'Finance', 'Documents', 'Services', 'Helpdesk', 'Procurement', 'Analytics', 
  'Permissions', 'Settings', 'Departments', 'Designations', 'Onboarding', 
  'Interviews', 'Candidates', 'Jobs', 'Job Applications', 'Leave', 'Expense'
];

const ROLES = [
  { value: 'platform-admin', label: 'Platform Super Admin' },
  { value: 'company-admin', label: 'Company Admin' },
  { value: 'hr-manager', label: 'HR Manager' },
  { value: 'team-manager', label: 'Team Manager' },
  { value: 'team-leader', label: 'Team Leader' },
  { value: 'sales-manager', label: 'Sales Manager' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employee', label: 'Employee' },
  { value: 'guest', label: 'Guest' },
];

type Permission = {
  id?: string;
  role: string;
  feature: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export default function FeaturePermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const authState = localStorage.getItem('akul-dravin-auth-state');
      const token = authState ? JSON.parse(authState).state?.accessToken : null;
      
      console.log('Fetching all permissions from database...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feature-permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('All permissions in database:', data);
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const getPermission = (role: string, feature: string) => {
    const found = permissions.find(p => p.role === role && p.feature === feature);
    if (found) {
      console.log(`Found permission for ${role} - ${feature}:`, found);
    }
    return found || {
      role,
      feature,
      canView: false,
      canEdit: false,
      canDelete: false,
    };
  };

  const updatePermission = (role: string, feature: string, field: 'canView' | 'canEdit' | 'canDelete', value: boolean) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.role === role && p.feature === feature);
      if (existing) {
        return prev.map(p => 
          p.role === role && p.feature === feature 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        return [...prev, { role, feature, canView: false, canEdit: false, canDelete: false, [field]: value }];
      }
    });
  };

  const getRoleStats = (roleValue: string) => {
    const rolePerms = permissions.filter(p => p.role === roleValue);
    const wrongPerms = rolePerms.filter(p => !p.canView && (p.canEdit || p.canDelete));
    return {
      total: rolePerms.length,
      hasIssues: wrongPerms.length > 0,
      issueCount: wrongPerms.length
    };
  };

  const clearRolePermissions = (roleValue: string) => {
    setPermissions(prev => prev.filter(p => p.role !== roleValue));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const authState = localStorage.getItem('akul-dravin-auth-state');
      const token = authState ? JSON.parse(authState).state?.accessToken : null;
      
      // Filter out permissions that have at least one checkbox checked
      const validPermissions = permissions.filter(p => p.canView || p.canEdit || p.canDelete);
      
      console.log('Saving permissions:', validPermissions);
      console.log('Total permissions to save:', validPermissions.length);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feature-permissions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(validPermissions),
      });
      
      console.log('Save response status:', res.status);
      const responseData = await res.json();
      console.log('Save response data:', responseData);
      
      if (res.ok) {
        toast({ title: 'Success', description: `Saved ${validPermissions.length} permissions successfully` });
        await fetchPermissions();
      } else {
        toast({ title: 'Error', description: `Failed to save: ${responseData.message || res.statusText}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Error', description: 'Failed to save permissions', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Permissions Management</h1>
          <p className="text-muted-foreground mt-2">Control which features are visible and accessible to each role</p>
        </div>
        <Button onClick={savePermissions} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {ROLES.map(role => {
        const stats = getRoleStats(role.value);
        return (
        <Card key={role.value}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CardTitle>{role.label}</CardTitle>
                {stats.total > 0 && (
                  <span className="text-sm text-gray-500">({stats.total} permissions)</span>
                )}
                {stats.hasIssues && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    ⚠️ {stats.issueCount} without View
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearRolePermissions(role.value)}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium">Feature</th>
                    <th className="text-center py-2 px-4 font-medium">View</th>
                    <th className="text-center py-2 px-4 font-medium">Edit</th>
                    <th className="text-center py-2 px-4 font-medium">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(feature => {
                    const perm = getPermission(role.value, feature);
                    return (
                      <tr key={feature} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{feature}</td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={perm.canView}
                            onCheckedChange={(checked) => 
                              updatePermission(role.value, feature, 'canView', checked as boolean)
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={perm.canEdit}
                            onCheckedChange={(checked) => 
                              updatePermission(role.value, feature, 'canEdit', checked as boolean)
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Checkbox
                            checked={perm.canDelete}
                            onCheckedChange={(checked) => 
                              updatePermission(role.value, feature, 'canDelete', checked as boolean)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      );
      })}
    </div>
  );
}
