import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/lib/types/auth';
import { CompanyDashboard } from '@/components/dashboard/CompanyDashboard';

interface DashboardPageProps {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { companyId } = await params;

  return (
    <ProtectedRoute 
      companyId={companyId}
      requiredPermissions={[Permission.VIEW_COMPANY]}
    >
      <CompanyDashboard companyId={companyId} />
    </ProtectedRoute>
  );
}
