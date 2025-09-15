import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function CompanyPortalRedirect({ params }: PageProps) {
  const { companyId } = await params
  redirect(`/${companyId}/sign-in`)
}

